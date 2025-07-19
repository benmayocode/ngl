// src/pages/ChatPage.jsx
import { useState, useEffect } from 'react'
import ChatUI from '../components/ChatUI'
import ChatInput from '../components/ChatInput'
import { fetchMessages } from '../services/chatService'

import { useMsal } from '@azure/msal-react'
import axios from 'axios'

export default function ChatPage({ currentSession }) {
  const [input, setInput] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const { instance, accounts } = useMsal()

  useEffect(() => {
    if (currentSession?.id) {
      fetchMessages(currentSession.id).then(setChatHistory)
    }
  }, [currentSession])

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
      <ChatInput
        input={input}
        setInput={setInput}
        chatHistory={chatHistory}
        setChatHistory={setChatHistory}
        loading={loading}
        setLoading={setLoading}
        sessionId={currentSession?.id}
      />
      <ChatUI
        input={input}
        setInput={setInput}
        chatHistory={chatHistory}
        loading={loading}
        setLoading={setLoading}
      />

    </>
  )
}
