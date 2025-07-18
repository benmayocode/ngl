import { useMsal } from '@azure/msal-react'
import FileUploader from './FileUploader'

export default function ChatUI({ chatHistory, loading }) {
  const { accounts } = useMsal()

  return (
    <div>
      <h4 className="mb-4">Welcome, {accounts[0].username}</h4>

      <FileUploader />

      <div className="mt-4">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`alert ${msg.role === 'user' ? 'alert-primary' : 'alert-info'}`}>
            <strong>{msg.role === 'user' ? 'You' : 'GPT'}:</strong>
            <p className="mb-0 mt-2">{msg.content}</p>
          </div>
        ))}

        {loading && (
          <div className="alert alert-secondary">
            GPT is thinking...
          </div>
        )}
      </div>
    </div>
  )
}
