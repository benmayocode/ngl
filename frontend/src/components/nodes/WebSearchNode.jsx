// frontend/src/components/nodes/WebSearchNode.jsx
import { Handle, Position } from 'reactflow';

export default function WebSearchNode({ data, isConnectable }) {
  const statusColor = {
    running: '#0d6efd',   // blue
    complete: '#198754',  // green
    error: '#dc3545'      // red
  }[data.status] || '#333';

  return (
    <div
      style={{
        padding: 10,
        border: `2px solid ${statusColor}`,
        borderRadius: 8,
        background: '#fff',
        width: 300
      }}
    >
      <strong>Web Search</strong>

      <div className="mb-2 mt-2">
        <label className="form-label small">Search Query</label>
        <input
          type="text"
          className="form-control form-control-sm"
          value={data.query}
          onChange={(e) => data.onChange({ ...data, query: e.target.value })}
        />
      </div>

      <div className="mb-2">
        <label className="form-label small">Max Results</label>
        <input
          type="number"
          className="form-control form-control-sm"
          value={data.maxResults}
          onChange={(e) => data.onChange({ ...data, maxResults: parseInt(e.target.value || '5') })}
        />
      </div>

      <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
    </div>
  );
}

