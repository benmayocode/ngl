import { useState, useEffect } from 'react';

export default function FlowSaveModal({ show, onClose, onSave, flowData }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(100);
  console.log('Flow data loaded:', flowData);

  useEffect(() => {
    if (flowData) {
      setName(flowData.name || '');
      setDescription(flowData.description || '');
    }
  }, [flowData]);

  const handleSave = async () => {
    const result = await onSave(name, description); // Wait for save
    if (result !== false) {
      setSuccess(true);
      let pct = 100;

      const interval = setInterval(() => {
        pct -= 2;
        setProgress(pct);
      }, 60);

      setTimeout(() => {
        clearInterval(interval);
        setSuccess(false);
        setProgress(100);
        onClose(); // ✅ Close modal
      }, 3000);
    }
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog" role="document">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title">Save Flow</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Flow Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {success && (
              <div className="alert alert-success position-relative" role="alert">
                Flow saved successfully!
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '4px',
                    backgroundColor: '#198754',
                    width: `${progress}%`,
                    transition: 'width 60ms linear',
                  }}
                />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save Flow
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
