export default function FlowControls({
  savedFlows,
  onLoadFlow,
  onShowSaveModal,
  runFlow
}) {
  return (
    <div className="p-3 bg-light border-bottom d-flex align-items-center gap-2">
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

      <button onClick={runFlow} className="btn btn-primary">
        Run Flow
      </button>
    </div>
  );
}
