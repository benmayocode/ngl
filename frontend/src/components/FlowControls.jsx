// frontend/src/components/FlowControls.jsx
export default function FlowControls({
  flowData,
  savedFlows,
  onLoadFlow,
  onShowSaveModal,
  runFlow,
  hasUnsavedChanges,
  handleNewFlow
}) {
  return (
    <div className="p-3 bg-light border-bottom">
      {/* Flow name */}
      <h3 className="text-muted mb-0">
        {flowData?.name || 'Untitled Flow'}
      </h3>
      <p className="text-muted ">{flowData?.description || 'No description available.'}</p>

      {/*
       Buttons and selector row */}
      <div className="d-flex align-items-center gap-2 flex-wrap">
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

        <button
          className="btn btn-outline-primary"
          onClick={async () => {
            if (hasUnsavedChanges) {
              const confirmNew = window.confirm("You have unsaved changes. Create a new flow anyway?");
              if (!confirmNew) return;
            }
            handleNewFlow();
          }}
        >
          New Flow
        </button>

        <button className="btn btn-primary" onClick={onShowSaveModal}>
          {flowData?.id ? 'Save Changes' : 'Save Flow'}
        </button>

        <button onClick={runFlow} className="btn btn-success">
          Run Flow
        </button>
      </div>
    </div>
  );
}
