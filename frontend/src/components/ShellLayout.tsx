// frontend/src/components/ShellLayout.tsx
import Sidebar from './Sidebar'
import { useLocation } from 'react-router-dom'
import { useState } from 'react'

import type { ChatSession } from '../types'

export default function ShellLayout({ children, flowProps = {} }) {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const location = useLocation()

  const isFlowRoute = location.pathname === '/flow'

  return (
    <div className="container-fluid vh-100 overflow-hidden">
      <div className="row h-100">
        <div className="col-12 col-md-3 col-lg-2 bg-light border-end p-3 d-flex flex-column h-100">
            <Sidebar
              selectedSessionId={currentSession?.id}
              onSelectSession={setCurrentSession}
            />
        </div>

        <div
          id="main-content"
          className="col position-relative p-0 overflow-auto px-4 pt-4 pb-5"
          style={{ height: '100%' }}
        >
          {children({ currentSession })}
        </div>
      </div>
    </div>
  )
}
