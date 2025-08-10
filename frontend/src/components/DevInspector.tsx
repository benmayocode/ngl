// frontend/src/components/DevInspector.tsx

interface DevInspectorProps {
  show: boolean;
  onClose: () => void;
  nodes: any[];
  edges: any[];
}

export default function DevInspector({ show, onClose, nodes, edges } : DevInspectorProps) {
  
  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title">🛠️ Dev Inspector</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
            <h6>🧩 Nodes</h6>
            <pre style={{ maxHeight: 600, overflowY: 'auto', color: '#9f9b9bff', background: '#2b2424ff', padding: 10 }}>
              {JSON.stringify(nodes, null, 2)}
            </pre>

            <h6 className="mt-3">🔗 Edges</h6>
            <pre style={{ maxHeight: 600, overflowY: 'auto', color: '#9f9b9bff', background: '#2b2424ff', padding: 10 }}>
              {JSON.stringify(edges, null, 2)}

            </pre>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
