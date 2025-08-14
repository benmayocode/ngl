// frontend/src/components/nodes/WebSearchNode.jsx
import { Handle, Position } from 'reactflow';

export default function WebSearchNode({ data, isConnectable }) {
  const statusColor = {
    running: '#0d6efd',
    complete: '#198754',
    error: '#dc3545',
  }[data.status] || '#333';

  // stop events so scrolling/dragging inside the node doesn't affect the canvas
  const stop = (e) => e.stopPropagation();

  return (
    <div
      style={{
        padding: 10,
        border: `2px solid ${statusColor}`,
        borderRadius: 8,
        background: '#fff',
        width: 300,
      }}
      onWheel={stop}
      onMouseDown={stop}
      onTouchStart={stop}
    >
      <strong>Web Search</strong>

      <div className="mb-2 mt-2">
        <label className="form-label small">Search Query</label>
        <input
          type="text"
          className="form-control form-control-sm nowheel nodrag"
          value={data.query}
          onChange={(e) => data.onChange({ ...data, query: e.target.value })}
          onWheel={stop}
          onMouseDown={stop}
          onTouchStart={stop}
        />
      </div>

      <div className="mb-2">
        <label className="form-label small">Max Results</label>
        <input
          type="number"
          className="form-control form-control-sm nowheel nodrag"
          value={data.maxResults}
          onChange={(e) =>
            data.onChange({ ...data, maxResults: parseInt(e.target.value || '5', 10) })
          }
          onWheel={stop}
          onMouseDown={stop}
          onTouchStart={stop}
        />
      </div>

      <Handle id="in" type="target" position={Position.Left} isConnectable={isConnectable} />
      <Handle id="out" type="source" position={Position.Right} isConnectable={isConnectable} />
    </div>
  );
}
