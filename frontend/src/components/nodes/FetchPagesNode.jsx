// frontend/src/components/nodes/FetchPagesNode.jsx
import { Handle, Position } from 'reactflow';

export default function FetchPagesNode({ data, isConnectable }) {
  const stop = (e) => e.stopPropagation();
  const concurrency = data.concurrency ?? 6;

  return (
    <div style={{ padding: 10, border: '2px solid #333', borderRadius: 8, background: '#fff', width: 300 }}
         onWheel={stop} onMouseDown={stop} onTouchStart={stop}>
      <strong>Fetch Pages</strong>
      <div className="mb-2 mt-2">
        <label className="form-label small">Concurrency</label>
        <input
          type="number"
          className="form-control form-control-sm nowheel nodrag"
          value={concurrency}
          min={1}
          max={16}
          onChange={(e) => data.onChange({ ...data, concurrency: parseInt(e.target.value || '6', 10) })}
        />
      </div>
      <Handle id="in"  type="target" position={Position.Left}  isConnectable={isConnectable} />
      <Handle id="out" type="source" position={Position.Right} isConnectable={isConnectable} />
    </div>
  );
}
