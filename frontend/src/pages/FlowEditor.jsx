import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import PromptNode from '../components/nodes/PromptNode';
import FlowControls from '../components/FlowControls';
import FlowSaveModal from '../components/FlowSaveModal';

const nodeTypes = {
  prompt: PromptNode
};

export default function FlowEditor({
  nodes,
  setNodes,
  onNodesChange,
  edges,
  setEdges,
  onEdgesChange,
  currentSession
}) {

  const [inputText, setInputText] = useState('');
  const [output, setOutput] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedFlows, setSavedFlows] = useState([]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const runFlow = async () => {
    const flow = {
      nodes: nodes.map(({ id, type, data, position }) => ({ id, type, data, position })),
      edges,
    };

    try {
      const res = await fetch('http://localhost:8000/api/langgraph/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow, input: inputText }),
      });
      const json = await res.json();
      setOutput(json.result);
    } catch (err) {
      console.error('Error executing flow:', err);
      setOutput('Error executing flow. See console.');
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
            setNodes(selected.nodes);
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
      </div>

      <FlowSaveModal
        show={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={saveFlow}
      />
    </div>
  );
}
