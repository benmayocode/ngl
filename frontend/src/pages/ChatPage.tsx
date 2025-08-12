// src/pages/ChatPage.tsx
import { useState, useEffect, use } from 'react'
import ChatHistory from '../components/ChatHistory'
import ChatInput from '../components/ChatInput'
import FlowModal from '../components/FlowModal'
import { fetchMessages } from '../services/chatService'
import { useShell } from '../components/ShellLayout'

import type { FlowState, FlowSuggestion } from '../types'

export default function ChatPage() {
  const { currentSession, chatHistory, setChatHistory } = useShell()

  const [input, setInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [flowState, setFlowState] = useState<FlowState | null>(null)
  const [flowSuggestion, setFlowSuggestion] = useState<FlowSuggestion | null>(null)
  const [showFlowModal, setShowFlowModal] = useState<boolean>(false);
  const [activeFlow, setActiveFlow] = useState<string | null>(null);

  useEffect(() => {
    if (currentSession?.id) {
      fetchMessages(currentSession.id).then(setChatHistory)
    }
  }, [currentSession])

  useEffect(() => {

  }, [showFlowModal])

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
      {JSON.stringify(currentSession)}
      <ChatHistory
        chatHistory={chatHistory}
        loading={loading}
        flowState={flowState}
        setFlowState={setFlowState}
        flowSuggestion={flowSuggestion}
        setFlowSuggestion={setFlowSuggestion}
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
