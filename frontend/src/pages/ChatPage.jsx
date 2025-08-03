// src/pages/ChatPage.jsx
import { useState, useEffect } from 'react'
import ChatUI from '../components/ChatUI'
import ChatInput from '../components/ChatInput'
import { fetchMessages } from '../services/chatService'

export default function ChatPage({ currentSession }) {
  const [input, setInput] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentSession?.id) {
      fetchMessages(currentSession.id).then(setChatHistory)
    }
  }, [currentSession])


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
