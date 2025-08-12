// frontend/src/components/ShellLayout.tsx
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import type { ChatSession, Message } from '../types'
import { fetchMessages } from '../services/chatService'

type ShellContextValue = {
  currentSession: ChatSession | null
  setCurrentSession: React.Dispatch<React.SetStateAction<ChatSession | null>>
  chatHistory: Message[]
  setChatHistory: React.Dispatch<React.SetStateAction<Message[]>>
  onSelectSession: (session: ChatSession) => Promise<void> | void
}

const ShellContext = createContext<ShellContextValue | undefined>(undefined)

export function useShell() {
  const ctx = useContext(ShellContext)
  if (!ctx) throw new Error('useShell must be used within <ShellLayout>')
  return ctx
}

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const location = useLocation()

  const onSelectSession = useCallback(async (session: ChatSession) => {
    setCurrentSession(session)
    // Option B: load here instead of in ChatPage
    const msgs = await fetchMessages(session.id)
    setChatHistory(msgs)
  }, [])


  const value = useMemo(
    () => ({ currentSession, setCurrentSession, chatHistory, setChatHistory, onSelectSession }),
    [currentSession, chatHistory]
  )

  return (
    <ShellContext.Provider value={value}>
      <div className="container-fluid vh-100 overflow-hidden">
        <div className="row h-100">
          <div className="col-12 col-md-3 col-lg-2 bg-light border-end p-3 d-flex flex-column h-100">
            <Sidebar />
          </div>
          <div id="main-content" className="col position-relative p-0 overflow-auto px-4 pt-4 pb-5" style={{ height: '100%' }}>
            {children}
          </div>
        </div>
      </div>
    </ShellContext.Provider>
  )
}
