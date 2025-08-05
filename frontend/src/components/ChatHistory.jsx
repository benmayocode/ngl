import { useState } from 'react'
import PreviewPanel from './PreviewPanel'

export default function ChatHistory({ chatHistory, loading, flowState, setFlowState, flowSuggestion, setFlowSuggestion }) {
  const [selectedSources, setSelectedSources] = useState([])
  const [showModal, setShowModal] = useState(false)

  const handleShowSources = (sources) => {
    setSelectedSources(sources)
    setShowModal(true)
  }

  const handleRunFlow = async () => {
    try {
      const res = await fetch(`/api/langgraph/run/${flowSuggestion.flow_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: flowState?.session_id || flowSuggestion.sessionId }),  // fallback
      });

      const data = await res.json();

      setFlowState({
        flow_id: flowSuggestion.flow_id,
        prompt: data.prompt,
      });

      setFlowSuggestion(null);
    } catch (err) {
      console.error("Failed to start flow:", err);
    }
  };

  return (
    <div className="mt-4 px-3" style={{ paddingBottom: '120px' }}>
      {chatHistory.map((msg, index) => {
        const isUser = msg.role === 'user'

        // ⛔️ Skip assistant flow suggestion message – we handle it separately below
        if (!isUser && msg.flow_suggestion) return null

        return (
          <div
            key={index}
            className={`d-flex mb-3 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}
          >
            <div
              className={`alert ${isUser ? 'alert-primary' : 'alert-secondary'} mb-0 chat-message`}
              style={{ width: isUser ? '75%' : '100%' }}
            >
              <p className="mb-0 mt-2">{msg.content}</p>

              {!isUser && msg.sources?.length > 0 && (
                <button
                  className="btn btn-link btn-sm mt-2"
                  onClick={() => handleShowSources(msg.sources)}
                >
                  🔍 View Sources
                </button>
              )}
            </div>
          </div>
        )
      })}


      {/* 💡 Flow suggestion block */}
      {flowSuggestion && (
        <div className="alert alert-info d-flex justify-content-between align-items-center">
          <div>
            💡 I found a saved flow that might help: <strong>{flowSuggestion.title}</strong><br />
            Would you like to run it?
          </div>
          <button className="btn btn-sm btn-success ms-3" onClick={handleRunFlow}>
            Run Flow
          </button>
        </div>
      )}

      {/* Sources modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" onClick={() => setShowModal(false)}>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Document Sources</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                {selectedSources.map((src, i) => (
                  <div key={i} className="mb-4">
                    <p><strong>Excerpt used:</strong><br />{src.excerpt}</p>
                    <PreviewPanel doc={{ id: src.doc_id }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Typing dots */}
      {loading && (
        <div className="d-flex justify-content-start mb-3">
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        </div>
      )}
    </div>
  )
}
