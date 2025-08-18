// frontend/src/components/nodes/ExtractFromPagesNode.jsx
import { Handle, Position } from 'reactflow';

export default function ExtractFromPagesNode({ data, isConnectable }) {
  const stop = (e) => e.stopPropagation();


const handleChange = (field) => (e) => {
  data.onChange({ ...data, [field]: e.target.value });
};

  return (
    <div
      style={{
        padding: 10,
        border: '2px solid #333',
        borderRadius: 8,
        background: '#fff',
        width: 360,
      }}
      onWheel={stop}
      onMouseDown={stop}
      onTouchStart={stop}
    >
      <strong>Extract From Pages</strong>

      <div className="mb-2 mt-2">
        <label className="form-label small">Mode</label>
        <select
          className="form-control form-control-sm nowheel nodrag"
          value={data.mode ?? 'links'}
          onChange={handleChange('mode')}
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
          value={data.instruction ?? ''}
          onChange={handleChange('instruction')}
          placeholder={
            data.mode === 'links'
              ? 'e.g., Only return listing/category pages'
              : 'e.g., Extract price, beds, address as JSON'
          }
        />
      </div>

      {(data.mode === 'text' || data.mode === 'json') && (
        <div className="mb-2">
          <label className="form-label small">Model</label>
          <input
            type="text"
            className="form-control form-control-sm nowheel nodrag"
            value={data.model ?? 'gpt-4o-mini'}
            onChange={handleChange('model')}
          />
        </div>
      )}

      <Handle
        id="in"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      <Handle
        id="out"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </div>
  );
}
