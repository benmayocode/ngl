import SidebarFlow from './SidebarFlow'
import { useLocation } from 'react-router-dom'
import { useState } from 'react'

export default function ShellLayout({ children, flowProps = {} }) {
  const [currentSession, setCurrentSession] = useState(null)
  const location = useLocation()

  const isFlowRoute = location.pathname === '/flow'

  return (
    <div className="container-fluid vh-100 overflow-hidden">
      <div className="row h-100">
        <div className="col-12 col-md-3 col-lg-2 bg-light border-end p-3 d-flex flex-column h-100">
          {isFlowRoute ? (
            <SidebarFlow {...flowProps} />
          ) : (
            <Sidebar
              selectedSessionId={currentSession?.id}
              onSelectSession={setCurrentSession}
            />
          )}
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
