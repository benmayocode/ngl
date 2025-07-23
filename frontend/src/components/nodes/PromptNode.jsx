// components/PromptNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';

export default function PromptNode({ data, isConnectable }) {
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
