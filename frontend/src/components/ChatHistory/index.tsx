import { useState } from 'react'
import PreviewPanel from '../PreviewPanel'
import type { ChatHistoryProps } from './types';

export default function ChatHistory({ chatHistory, loading, setShowFlowModal, setActiveFlow }: ChatHistoryProps) {
  const [selectedSources, setSelectedSources] = useState<Array<any>>([])
  const [showModal, setShowModal] = useState(false)

  const handleShowSources = (sources) => {
    setSelectedSources(sources)
    setShowModal(true)
  }
  return (
    chatHistory === undefined ? (
      <div className="text-center mt-5">
        <p className="text-muted">No messages yet. Start a conversation!</p>
      </div>
    ) : (
      <div className="mt-4 px-3" style={{ paddingBottom: '120px' }}>
        {chatHistory.map((msg, index) => {
          const isUser = msg.role === 'user'
          const msgFlowSuggestionId = msg.flowSuggestion?.flowId
          const msgFlowSuggestion = msg.flowSuggestion

          return (
            <div
              key={index}
              className={`d-flex mb-3 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}
            >

            {msgFlowSuggestionId && (
              <div className="alert alert-info d-flex justify-content-between align-items-center">
                <div>
                  💡 I found a saved flow that might help: <strong>{msgFlowSuggestion?.title}</strong><br />
                  Would you like to run it?
                </div>
                <button
                  className="btn btn-sm btn-success ms-3"
                  onClick={() => {
                    console.log('Running flow suggestion:', msgFlowSuggestion)
                    setActiveFlow(msgFlowSuggestion.flowId)
                    setShowFlowModal(prev => !prev)
                  }}
                >
                  Run Flow
                </button>

              </div>
            )}

            {!msgFlowSuggestionId && (
              <div
                className={`alert ${isUser ? 'alert-primary' : 'alert-secondary'} mb-0 chat-message`}
                style={{ width: isUser ? '75%' : '100%' }}
              >
                <p className="mb-0 mt-2">{msg.content}</p>
                {!isUser && msg.sources.length > 0 && (
                  <button
                    className="btn btn-link btn-sm mt-2"
                    onClick={() => handleShowSources(msg.sources)}
                  >
                    🔍 View Sources
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
      {/* Sources modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} onClick={() => setShowModal(false)}>
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
  )
}