// src/pages/ChatPage.tsx
import { useState, useEffect } from 'react'
import ChatHistory from '../components/ChatHistory'
import ChatInput from '../components/ChatInput'
import FlowModal from '../components/FlowModal'
import { fetchMessages } from '../services/chatService'

import type { ChatSession, Message, FlowState, FlowSuggestion } from '../types'

interface ChatPageProps {
  currentSession: ChatSession | null;
}

export default function ChatPage({ currentSession }: ChatPageProps) {
  const [input, setInput] = useState<string>('')
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [flowState, setFlowState] = useState<FlowState | null>(null)
  const [flowSuggestion, setFlowSuggestion] = useState<FlowSuggestion | null>(null)
  const [showFlowModal, setShowFlowModal] = useState<boolean>(false);
  // activeFlow is a UUID
  const [activeFlow, setActiveFlow] = useState<string | null>(null);

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
        sessionId={currentSession?.id ?? null}
        flowState={flowState}
        setFlowState={setFlowState}
        flowSuggestion={flowSuggestion}
        setFlowSuggestion={setFlowSuggestion}
      />
      <ChatHistory
        chatHistory={chatHistory}
        loading={loading}
        flowState={flowState}
        setFlowState={setFlowState}
        flowSuggestion={flowSuggestion}
        setFlowSuggestion={setFlowSuggestion}
        sessionId={currentSession?.id}
        showFlowModal={showFlowModal}
        setShowFlowModal={setShowFlowModal}
        setActiveFlow={setActiveFlow}
      />
      {showFlowModal && activeFlow && (
        <FlowModal
          flowId={activeFlow}
          sessionId={currentSession?.id}
          onClose={() => {
            setShowFlowModal(false)
            setActiveFlow(null)
            setFlowSuggestion(null)
          }}
        />
      )}

    </>
  )
}
