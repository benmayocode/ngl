import { Handle, Position } from 'reactflow';

export default function PromptNode({ data, isConnectable }) {
  return (
    <div style={{ padding: 10, border: '1px solid #555', borderRadius: 8, background: '#eef', width: 250 }}>
      <strong>{data.label || 'Prompt Node'}</strong>
      <select
        className="form-select form-select-sm mt-2"
        value={data.model || 'gpt-3.5-turbo'}
        onChange={(e) => data.onChange({ ...data, model: e.target.value })}
      >
        <option value="gpt-4">OpenAI GPT-4</option>
        <option value="gpt-3.5-turbo">OpenAI GPT-3.5</option>
      </select>

      {/* Template field */}
      <div style={{ marginTop: 8 }}>
        <label className="form-label small">Prompt Template</label>
        <textarea
          value={data.template}
          onChange={(e) => data.onChange({ ...data, template: e.target.value })}
          placeholder="e.g. Summarise: {{input}}"
          rows={4}
          className="form-control"
        />
      </div>

      {/* Optional static input for standalone use */}
      <div style={{ marginTop: 8 }}>
        <label className="form-label small">Test Input (optional)</label>
        <input
          type="text"
          className="form-control"
          value={data.testInput || ''}
          onChange={(e) => data.onChange({ ...data, testInput: e.target.value })}
        />
      </div>

      <Handle id="in" type="target" position={Position.Left} isConnectable={isConnectable} />
      <Handle id="out" type="source" position={Position.Right} isConnectable={isConnectable} />
    </div>
  );
}
