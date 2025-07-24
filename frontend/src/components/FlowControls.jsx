import React from 'react';

export default function FlowControls({
  inputText,
  setInputText,
  output,
  runFlow,
  savedFlows,
  onLoadFlow,
  onShowSaveModal
}) {
  return (
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

      <select
        className="form-select w-auto"
        onChange={(e) => onLoadFlow(e.target.value)}
      >
        <option value="">-- Load Saved Flow --</option>
        {savedFlows.map(flow => (
          <option key={flow.id} value={flow.id}>
            {flow.name}
          </option>
        ))}
      </select>

      <button onClick={onShowSaveModal} className="btn btn-outline-success">
        Save Flow
      </button>

      {output && (
        <div className="ms-3">
          <strong>Output:</strong> {output}
        </div>
      )}
    </div>
  );
}
