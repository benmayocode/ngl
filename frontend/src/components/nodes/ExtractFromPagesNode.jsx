// frontend/src/components/nodes/ExtractFromPagesNode.jsx
import { Handle, Position } from 'reactflow';

export default function ExtractFromPagesNode({ data, isConnectable }) {
  const stop = (e) => e.stopPropagation();
  const mode = data.mode ?? 'links';
  const model = data.model ?? 'gpt-4o-mini';
  const instruction = data.instruction ?? '';

  return (
    <div style={{ padding: 10, border: '2px solid #333', borderRadius: 8, background: '#fff', width: 360 }}
         onWheel={stop} onMouseDown={stop} onTouchStart={stop}>
      <strong>Extract From Pages</strong>

      <div className="mb-2 mt-2">
        <label className="form-label small">Mode</label>
        <select
          className="form-control form-control-sm nowheel nodrag"
          value={mode}
          onChange={(e) => data.onChange({ ...data, mode: e.target.value })}
        >
          <option value="links">Links</option>
          <option value="text">Text (LLM summary)</option>
          <option value="json">JSON (LLM)</option>
        </select>
      </div>

      <div className="mb-2">
        <label className="form-label small">Instruction</label>
        <textarea
          className="form-control form-control-sm nowheel nodrag"
          rows={3}
          value={instruction}
          placeholder={mode === 'links'
            ? 'e.g., Only return listing/category pages'
            : 'e.g., Extract price, beds, address as JSON'}
          onChange={(e) => data.onChange({ ...data, instruction: e.target.value })}
        />
      </div>

      {(mode === 'text' || mode === 'json') && (
        <div className="mb-2">
          <label className="form-label small">Model</label>
          <input
            type="text"
            className="form-control form-control-sm nowheel nodrag"
            value={model}
            onChange={(e) => data.onChange({ ...data, model: e.target.value })}
          />
        </div>
      )}

      <Handle id="in"  type="target" position={Position.Left}  isConnectable={isConnectable} />
      <Handle id="out" type="source" position={Position.Right} isConnectable={isConnectable} />
    </div>
  );
}
