// frontend/src/pages/FlowEditor.tsx
import { useCallback, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactFlow, { MiniMap, Controls, Background, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';

import DevInspector from '../components/DevInspector';
import PromptNode from '../components/nodes/PromptNode';
import OutputNode from '../components/nodes/OutputNode';
import FlowControls from '../components/FlowControls';
import FlowSaveModal from '../components/FlowSaveModal';
import WebSearchNode from '../components/nodes/WebSearchNode';
import ListingPageFinderNode from '../components/nodes/ListingPageFInderNode';
import { rehydrateNodesFromRegistry, injectOnChangeHandlers } from '../components/nodes/registry';
import { getApiRoot } from '../services/apiConfig';

const nodeTypes = {
  prompt: PromptNode,
  output: OutputNode,
  web_search: WebSearchNode,
  listing_page_finder: ListingPageFinderNode,
};

// --- helpers to build URLs from the current API root ---
function joinPath(...parts: string[]) {
  return parts
    .filter(Boolean)
    .map(p => p.replace(/(^\/+|\/+$)/g, ''))
    .join('/');
}
function api(path = '') {
  const root = getApiRoot().replace(/\/+$/, '');; // e.g. https://host/api or http://localhost:8000/api
  console.log('API root:', root);
  return `${root}/${joinPath(path)}`;
}
function wsUrl(path = '') {
  const root = getApiRoot(); // e.g. https://host/api or http://localhost:8000/api
  const u = new URL(root);
  const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
  // Preserve the /api prefix from the http root for WS too
  const basePath = u.pathname; // e.g. "/api"
  const fullPath = '/' + joinPath(basePath, path); // e.g. "/api/langgraph/execute"
  return `${proto}//${u.host}${fullPath}`;
}

export default function FlowEditor({
  nodes,
  setNodes,
  onNodesChange,
  edges,
  setEdges,
  onEdgesChange
}) {
  const [inputText, setInputText] = useState('');
  const [flowData, setFlowData] = useState<any>({});
  const [output, setOutput] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedFlows, setSavedFlows] = useState<any[]>([]);
  const [showInspector, setShowInspector] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const flowIdFromUrl = searchParams.get('id');

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    if (!flowData) return;
    const current = JSON.stringify({
      nodes: nodes.map(({ id, type, data, position }) => ({ id, type, data, position })),
      edges,
    });
    const original = JSON.stringify({
      nodes: flowData.nodes,
      edges: flowData.edges,
    });
    setHasUnsavedChanges(current !== original);
  }, [nodes, edges, flowData]);

  const runFlow = () => {
    const socket = new WebSocket(wsUrl('/langgraph/execute')); // was ws://localhost:8000/api/langgraph/execute

    socket.onopen = () => {
      console.log('🟢 WebSocket connected. Sending flow...');
      socket.send(JSON.stringify({
        flow: { nodes, edges },
        input: inputText
      }));
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('📬 WebSocket message received:', message);

      if (message.type === 'status') {
        const { nodeId, status, detail } = message;
        setNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status,
                    error: status === 'error' ? detail?.message : undefined,
                  },
                }
              : n
          )
        );
      } else if (message.type === 'complete') {
        const { nodes: updatedNodes, edges: updatedEdges } = message.result;
        setNodes((prev) => {
          const statusMap = Object.fromEntries(
            prev.map((n) => [
              n.id,
              { status: n.data.status, error: n.data.error }
            ])
          );
          const merged = updatedNodes.map((node) => ({
            ...node,
            data: { ...node.data, ...statusMap[node.id] },
          }));
          return injectOnChangeHandlers(
            rehydrateNodesFromRegistry(merged, setNodes),
            setNodes
          );
        });
        setEdges(updatedEdges);
        console.log('✅ Flow execution complete');
      } else if (message.type === 'error') {
        console.error('❌ Flow execution error:', message.message);
      }
    };

    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket connection closed.');
    };
  };

  const saveFlow = async (name: string, description: string) => {
    const payload = {
      name,
      description,
      nodes: nodes.map(({ id, type, data, position }) => ({ id, type, data, position })),
      edges,
      created_by: 'demo-user@example.com',
    };

    try {
      let res: Response, json: any;
      if (flowData?.id) {
        res = await fetch(api(`/flows/${flowData.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        json = await res.json();
        setSavedFlows((prevFlows) =>
          prevFlows.map((flow) => (flow.id === json.id ? json : flow))
        );
      } else {
        res = await fetch(api('/flows/'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        json = await res.json();
        setSavedFlows((prev) => [...prev, json]);
        setSearchParams({ id: json.id });
      }

      setFlowData(json);
      return true;
    } catch (err) {
      console.error('Error saving flow:', err);
      return false;
    }
  };

  const handleNewFlow = () => {
    setNodes([]);
    setEdges([]);
    setFlowData(null);
    setSearchParams({});
  };

  const handleLoadFlow = (flowId: string) => {
    const selected = savedFlows.find((f) => f.id === flowId);
    if (!selected) return;

    if (hasUnsavedChanges) {
      const confirmLoad = window.confirm('You have unsaved changes. Load new flow anyway?');
      if (!confirmLoad) return;
    }

    const updatedNodes = rehydrateNodesFromRegistry(selected.nodes, setNodes);
    setNodes(updatedNodes);
    setEdges(selected.edges);
    setFlowData(selected);
    setSearchParams({ id: flowId });
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(api('/flows/'));
        const json = await res.json();
        const flows = Array.isArray(json) ? json : [];
        setSavedFlows(flows);

        if (flowIdFromUrl) {
          const selected = flows.find((f) => f.id === flowIdFromUrl);
          if (selected) {
            setFlowData(selected);
            const updatedNodes = injectOnChangeHandlers(
              rehydrateNodesFromRegistry(selected.nodes, setNodes),
              setNodes
            );
            setNodes(updatedNodes);
            setEdges(selected.edges);
          }
        }
      } catch (err) {
        console.error('Error loading flows:', err);
      }
    };

    init();
  }, [flowIdFromUrl]);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <FlowControls
        inputText={inputText}
        setInputText={setInputText}
        output={output}
        runFlow={runFlow}
        savedFlows={Array.isArray(savedFlows) ? savedFlows : []}
        onLoadFlow={handleLoadFlow}
        onShowSaveModal={() => setShowSaveModal(true)}
        hasUnsavedChanges={hasUnsavedChanges}
        flowData={flowData}
        handleNewFlow={handleNewFlow}
      />

      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background gap={12} size={1} />
        </ReactFlow>

        <button
          onClick={() => setShowInspector(true)}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            zIndex: 10,
            padding: '6px 12px',
            fontSize: '0.85rem',
            backgroundColor: '#eee',
            border: '1px solid #ccc',
            borderRadius: 4,
          }}
        >
          🛠 Dev
        </button>

        <DevInspector
          show={showInspector}
          onClose={() => setShowInspector(false)}
          nodes={nodes}
          edges={edges}
        />
      </div>

      <FlowSaveModal
        show={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={saveFlow}
        flowData={flowData}
        hasUnsavedChanges={hasUnsavedChanges}
        setHasUnsavedChanges={setHasUnsavedChanges}
      />
    </div>
  );
}
