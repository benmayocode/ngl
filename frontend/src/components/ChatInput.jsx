// src/pages/ChatInput.jsx
import { useState } from 'react'
import FileUploader from '../components/FileUploader'

import { useMsal } from '@azure/msal-react'
import axios from 'axios'

export default function ChatInput({input, setInput, chatHistory, setChatHistory, loading, setLoading}) {

  const { instance, accounts } = useMsal()
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
            user_email: accounts[0].username,  // or .idTokenClaims.email if you want to be safer
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
    <>

      <div className="position-absolute bottom-0 start-0 end-0 p-4 bg-white border-top">
        <FileUploader />
        <form className="d-flex gap-2" onSubmit={handleChatSubmit}>
          <input
            type="text"
            className="form-control"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !input.trim()}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </>
  )
}
