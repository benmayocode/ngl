// src/pages/ChatInput.jsx
import { useEffect, useState } from 'react'
import FileUploader from '../components/FileUploader'
import { useMsal } from '@azure/msal-react'
import axios from 'axios'

export default function ChatInput({ input, setInput, chatHistory, setChatHistory, loading, setLoading }) {
    const { instance, accounts } = useMsal()
    const [parentWidth, setParentWidth] = useState(0)
    const [style, setStyle] = useState({ width: 0, left: 0 })

    useEffect(() => {
        const updatePosition = () => {
            const container = document.getElementById('main-content')
            if (container) {
                const { offsetLeft, offsetWidth } = container
                setStyle({
                    width: offsetWidth * 0.75,
                    left: offsetLeft + offsetWidth * 0.125
                })
            }
        }

        updatePosition()
        window.addEventListener('resize', updatePosition)
        return () => window.removeEventListener('resize', updatePosition)
    }, [])


    const handleChatSubmit = async (e) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMessage = input.trim()
        setInput('')
        setLoading(true)

        try {
            const result = await instance.acquireTokenSilent({
                scopes: ['User.Read'],
                account: accounts[0],
            })

            const res = await axios.post(
                '/api/chat',
                {
                    message: userMessage,
                    user_email: accounts[0].username,
                },
                {
                    headers: { Authorization: `Bearer ${result.accessToken}` },
                }
            )

            const botResponse = res.data.response

            setChatHistory((prev) => [
                ...prev,
                { role: 'user', content: userMessage },
                { role: 'assistant', content: botResponse },
            ])
        } catch (err) {
            setChatHistory((prev) => [
                ...prev,
                { role: 'user', content: userMessage },
                { role: 'assistant', content: 'Error: ' + err.message },
            ])
        }

        setLoading(false)
    }

    return (
<div
  className="position-fixed bottom-0 mb-4"
  style={{
    position: 'fixed',
    width: style.width,
    left: style.left,
    zIndex: 1000,
  }}
>
  <div className="position-relative bg-white rounded shadow border p-3">
    {/* Text input field */}
    <input
      type="text"
      className="form-control mb-2"
      placeholder="Type your message..."
      value={input}
      onChange={(e) => setInput(e.target.value)}
      disabled={loading}
    />

    {/* Button row */}
    <div className="d-flex justify-content-between align-items-center">
      <FileUploader />
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleChatSubmit}
        disabled={loading || !input.trim()}
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  </div>
</div>
    )
}
