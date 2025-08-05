// src/pages/ChatPage.jsx
import { useState, useEffect } from 'react'
import ChatHistory from '../components/ChatHistory'
import ChatInput from '../components/ChatInput'
import { fetchMessages } from '../services/chatService'

export default function ChatPage({ currentSession }) {
  const [input, setInput] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [flowState, setFlowState] = useState(null)
  const [flowSuggestion, setFlowSuggestion] = useState(null)  // optional

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
        flowState={flowState}
        setFlowState={setFlowState}
        flowSuggestion={flowSuggestion}
        setFlowSuggestion={setFlowSuggestion}
      />
      <ChatHistory
        input={input}
        setInput={setInput}
        chatHistory={chatHistory}
        loading={loading}
        setLoading={setLoading}
        flowState={flowState}
        setFlowState={setFlowState}
        flowSuggestion={flowSuggestion}
        setFlowSuggestion={setFlowSuggestion}
      />

    </>
  )
}
