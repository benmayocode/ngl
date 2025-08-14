// frontend/src/pages/FlowEditor.tsx
import { useCallback, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactFlow, { MiniMap, Controls, Background, addEdge, Connection, Edge, Node } from 'reactflow';
import { NODE_DEFS, NodeDef } from '../components/nodes/registry';
import { isCompatible } from '../types';


import 'reactflow/dist/style.css';

import DevInspector from '../components/DevInspector';
import PromptNode from '../components/nodes/PromptNode';
import OutputNode from '../components/nodes/OutputNode';
import FlowControls from '../components/FlowControls';
import FlowSaveModal from '../components/FlowSaveModal';
import WebSearchNode from '../components/nodes/WebSearchNode';
import ListingPageFinderNode from '../components/nodes/ListingPageFInderNode';
import FetchPagesNode from '../components/nodes/FetchPagesNode';
import ExtractFromPagesNode from '../components/nodes/ExtractFromPagesNode';
import { rehydrateNodesFromRegistry, injectOnChangeHandlers } from '../components/nodes/registry';
import { getApiRoot } from '../services/apiConfig';

const nodeTypes = {
  prompt: PromptNode,
  output: OutputNode,
  web_search: WebSearchNode,
  listing_page_finder: ListingPageFinderNode,
  fetch_pages: FetchPagesNode,
  extract_from_pages: ExtractFromPagesNode,

};

function getPortType(node: Node, handleId: string, isSource: boolean) {
  const def = NODE_DEFS[node.type as keyof typeof NODE_DEFS] as NodeDef | undefined;
  if (!def) return null;
  return isSource ? def.outputs[handleId]?.type : def.inputs[handleId]?.type;
}

const isValidConnection = (conn: Connection, nodes: Node[]) => {
  const source = nodes.find(n => n.id === conn.source);
  const target = nodes.find(n => n.id === conn.target);
  if (!source || !target || !conn.sourceHandle || !conn.targetHandle) return false;

  const outType = getPortType(source, conn.sourceHandle, true);
  const inType = getPortType(target, conn.targetHandle, false);
  if (!outType || !inType) return false;

  return isCompatible(outType, inType);
};

function suggestAdapter(out, need) {
  // example rules:
  if (out?.kind === 'list' && out.of?.kind === 'text' && need?.kind === 'list' && need.of?.kind === 'link') {
    return 'text_urls_to_links';
  }
  if (need?.kind === 'list' && out?.kind !== 'list') {
    return 'to_list';
  }
  return null;
}



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

  const onConnect = useCallback((conn: Connection) => {
    const source = nodes.find(n => n.id === conn.source);
    const target = nodes.find(n => n.id === conn.target);
    if (!source || !target) return;

    const outType = getPortType(source, conn.sourceHandle || 'out', true);
    const inType = getPortType(target, conn.targetHandle || 'in', false);
    if (!outType || !inType) return;

    if (isCompatible(outType, inType)) {
      setEdges((eds) => addEdge(conn, eds)); // no adapter needed
      return;
    }

    const adapterType = suggestAdapter(outType, inType);
    if (!adapterType) {
      // show toast/snackbar if you like
      return;
    }

    // Create adapter node roughly midway between source & target
    const midX = (source.position.x + target.position.x) / 2;
    const midY = (source.position.y + target.position.y) / 2;
    const adapterId = `adapter_${Date.now()}`;

    setNodes((nds) => [
      ...nds,
      {
        id: adapterId,
        type: adapterType,
        position: { x: midX, y: midY },
        data: { label: NODE_DEFS[adapterType]?.label || 'Adapter' },
      },
    ]);

    setEdges((eds) => [
      ...eds,
      {
        id: `e-${source.id}-${adapterId}`,
        source: source.id,
        target: adapterId,
        sourceHandle: conn.sourceHandle || 'out',
        targetHandle: 'in',
      },
      {
        id: `e-${adapterId}-${target.id}`,
        source: adapterId,
        target: target.id,
        sourceHandle: 'out',
        targetHandle: conn.targetHandle || 'in',
      },
    ]);
  }, [nodes, setNodes, setEdges]);

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
          isValidConnection={(c) => isValidConnection(c, nodes)}
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
