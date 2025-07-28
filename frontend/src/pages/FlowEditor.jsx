// frontend/src/pages/FlowEditor.jsx
import React, { useCallback, useState, useEffect } from 'react';
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

import { rehydrateNodesFromRegistry } from '../components/nodes/registry';

const nodeTypes = {
  prompt: PromptNode,
  output: OutputNode,
  web_search: WebSearchNode,

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
  const [output, setOutput] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedFlows, setSavedFlows] = useState([]);
  const [showInspector, setShowInspector] = useState(false);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

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
        const updatedNodes = rehydrateNodesFromRegistry(result.nodes, setNodes);
        setNodes(updatedNodes);
        setEdges(result.edges);
      }

      console.log('Flow executed and updated graph applied.');
    } catch (err) {
      console.error('Error executing flow:', err);
    }
  };



  const saveFlow = async (name, description) => {
    const flow = {
      name,
      description,
      nodes: nodes.map(({ id, type, data, position }) => ({ id, type, data, position })),
      edges,
      created_by: 'demo-user@example.com',
    };

    try {
      const res = await fetch('http://localhost:8000/api/flows/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flow),
      });
      const json = await res.json();
      setSavedFlows((prev) => [...prev, json]);
      setShowSaveModal(false);
    } catch (err) {
      console.error('Error saving flow:', err);
    }
  };

  const loadFlows = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/flows/');
      const json = await res.json();
      setSavedFlows(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Error loading flows:', err);
    }
  };

  useEffect(() => {
    loadFlows();
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <FlowControls
        inputText={inputText}
        setInputText={setInputText}
        output={output}
        runFlow={runFlow}
        savedFlows={Array.isArray(savedFlows) ? savedFlows : []}
        
        onLoadFlow={(flowId) => {
          const selected = savedFlows.find((f) => f.id === flowId);
          if (selected) {
            const updatedNodes = rehydrateNodesFromRegistry(selected.nodes, setNodes);
            setNodes(updatedNodes);
            setEdges(selected.edges);
          }
        }}
        onShowSaveModal={() => setShowSaveModal(true)}
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
/>      </div>

      <FlowSaveModal
        show={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={saveFlow}
      />
    </div>
  );
}
