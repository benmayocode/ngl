// frontend/src/components/nodes/ListingPageFinderNode.jsx
import { Handle, Position } from 'reactflow';

export default function ListingPageFinderNode({ data, isConnectable }) {
  const { baseUrl, model = 'gpt-4', onChange } = data;

  const handleChange = (field) => (e) => {
    onChange({ ...data, [field]: e.target.value });
  };

  return (
    <div style={{ padding: 10, border: '1px solid #333', borderRadius: 8, background: '#fff', width: 300 }}>
      <strong>Find Listing Page</strong>

      <div className="mb-2 mt-2">
        <label className="form-label small">Base URL</label>
        <input
          type="text"
          className="form-control form-control-sm"
          value={baseUrl}
          onChange={handleChange('baseUrl')}
        />
      </div>

      <div className="mb-2">
        <label className="form-label small">Model</label>
        <select
          className="form-select form-select-sm"
          value={model}
          onChange={handleChange('model')}
        >
          <option value="gpt-4">gpt-4</option>
          <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
        </select>
      </div>

      {/* Optional: show output preview */}
      {data.output && (
        <div className="small mt-2" style={{ color: '#666' }}>
          <strong>Output:</strong><br />
          <code>{data.output}</code>
        </div>
      )}

      <Handle id="in" type="target" position={Position.Left} isConnectable={isConnectable} />
      <Handle id="out" type="source" position={Position.Right} isConnectable={isConnectable} />
    </div>
  );
}
