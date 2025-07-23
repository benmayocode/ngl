import React, { useCallback, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

function PromptNode({ data, isConnectable }) {
  return (
    <div style={{ padding: 10, border: '1px solid #555', borderRadius: 8, background: '#eef' }}>
      <strong>{data.label || 'Prompt Node'}</strong>
      <div>
        <textarea
          value={data.template}
          onChange={(e) => data.onChange(e.target.value)}
          placeholder="Enter prompt template..."
          rows={4}
          style={{ width: '100%', marginTop: 8 }}
        />
      </div>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
    </div>
  );
}

const nodeTypes = {
  prompt: PromptNode
};

export default function FlowEditor({ nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange }) {
  const [inputText, setInputText] = useState('');
  const [output, setOutput] = useState('');
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const runFlow = async () => {
    const flow = {
      nodes: nodes.map(({ id, type, data, position }) => ({ id, type, data, position })),
      edges
    };

    try {
      const res = await fetch('http://localhost:8000/api/langgraph/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow, input: inputText })
      });
      const json = await res.json();
      setOutput(json.result);
    } catch (err) {
      console.error('Error executing flow:', err);
      setOutput('Error executing flow. See console.');
    }
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="p-3 bg-light border-bottom d-flex align-items-center gap-2">
        <input
          type="text"
          className="form-control"
          placeholder="Enter input..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ maxWidth: 400 }}
        />
        <button onClick={runFlow} className="btn btn-primary">
          Run Flow
        </button>
        {output && <div className="ms-3"><strong>Output:</strong> {output}</div>}
      </div>

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
    </div>
  );
}