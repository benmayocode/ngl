// frontend/src/pages/FlowEditor.jsx
import { useCallback, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import DevInspector from '../components/DevInspector';
import PromptNode from '../components/nodes/PromptNode';
import OutputNode from '../components/nodes/OutputNode';
import FlowControls from '../components/FlowControls';
import FlowSaveModal from '../components/FlowSaveModal';
import WebSearchNode from '../components/nodes/WebSearchNode';
import ListingPageFinderNode from '../components/nodes/ListingPageFInderNode';
import { rehydrateNodesFromRegistry } from '../components/nodes/registry';
import { injectOnChangeHandlers } from '../components/nodes/registry';

const nodeTypes = {
  prompt: PromptNode,
  output: OutputNode,
  web_search: WebSearchNode,
  listing_page_finder: ListingPageFinderNode,

};

export default function FlowEditor({
  nodes,
  setNodes,
  onNodesChange,
  edges,
  setEdges,
  onEdgesChange
}) {

  const [inputText, setInputText] = useState('');
  const [flowData, setFlowData] = useState({});
  const [output, setOutput] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedFlows, setSavedFlows] = useState([]);
  const [showInspector, setShowInspector] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const flowIdFromUrl = searchParams.get("id");

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

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

  const runFlow = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/langgraph/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow: { nodes, edges }, input: inputText })
      });

      const json = await res.json();
      const { result } = json;

      // Set updated nodes/edges from backend
      if (result?.nodes && result?.edges) {
        const updatedNodes = injectOnChangeHandlers(
          rehydrateNodesFromRegistry(selected.nodes, setNodes),
          setNodes
        );
        setNodes(updatedNodes);
        setEdges(result.edges);
      }

      console.log('Flow executed and updated graph applied.');
    } catch (err) {
      console.error('Error executing flow:', err);
    }
  };

  const saveFlow = async (name, description) => {
    const payload = {
      name,
      description,
      nodes: nodes.map(({ id, type, data, position }) => ({ id, type, data, position })),
      edges,
      created_by: 'demo-user@example.com',
    };

    try {
      let res, json;
      if (flowData?.id) {
        res = await fetch(`http://localhost:8000/api/flows/${flowData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        json = await res.json();
        setSavedFlows((prev) => prev.map((f) => (f.id === json.id ? json : f)));
      } else {
        res = await fetch('http://localhost:8000/api/flows/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        json = await res.json();
        setSavedFlows((prev) => [...prev, json]);
        setSearchParams({ id: json.id });
      }

      setFlowData(json);
      return true; // ✅ indicate success
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

  const handleLoadFlow = (flowId) => {
    const selected = savedFlows.find((f) => f.id === flowId);
    if (!selected) return;

    if (hasUnsavedChanges) {
      const confirmLoad = window.confirm("You have unsaved changes. Load new flow anyway?");
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
        const res = await fetch('http://localhost:8000/api/flows/');
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
        {/* 🛠️ Dev Tools Button */}
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
