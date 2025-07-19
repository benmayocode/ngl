import { useMsal } from '@azure/msal-react'

export default function ChatUI({ chatHistory, loading }) {
  const { accounts } = useMsal()

  return (
  <div className="mt-4 px-3" style={{ paddingBottom: '120px' }}>
      {chatHistory.map((msg, index) => {
        const isUser = msg.role === 'user'
        return (
          <div
            key={index}
            className={`d-flex mb-3 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}
          >
            <div
              className={`alert ${isUser ? 'alert-primary' : 'alert-secondary'} mb-0 chat-message`}
              style={{
                width: isUser ? '75%' : '100%',
              }}
            >
              {/* <strong>{isUser ? 'You' : 'GPT'}:</strong> */}
              <p className="mb-0 mt-2">{msg.content}</p>
            </div>
          </div>
        )
      })}


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
