// frontend/src/components/Sidebar.jsx
import { useMsal } from '@azure/msal-react'
import { useEffect, useState } from 'react'
import { fetchSessions, createSession } from '../services/chatService'
import { ADMIN_USERS } from '../constants/admins'
import { useNavigate, useLocation } from 'react-router-dom'
import UserBadge from './UserBadge'

export default function Sidebar({ selectedSessionId, onSelectSession }) {
  const { instance, accounts } = useMsal()
  const navigate = useNavigate()
  const location = useLocation()
  const userEmail = accounts[0]?.username
  const isAdmin = ADMIN_USERS.includes(userEmail)

  const [sessions, setSessions] = useState([])

  useEffect(() => {
    if (userEmail) {
      fetchSessions(userEmail).then(setSessions)
    }
  }, [userEmail])

  const handleNewChat = async () => {
    const session = await createSession({ userEmail, title: 'New Chat' })
    setSessions((prev) => [session, ...prev])
    onSelectSession(session)
  }

  const onAdminClick = () => {
    if (location.pathname === '/admin') {
      navigate('/')
    } else {
      navigate('/admin')
    }
  }

  const handleLogout = () => {
    instance.logoutPopup()
  }

  return (
    <div className="d-flex flex-column h-100">
      <div>
        <button
          className="btn btn-outline-primary w-100 mb-3"
          onClick={handleNewChat}
        >
          + New Chat
        </button>

        <div className="list-group mb-4">
          {sessions.map((session) => (
            <button
              key={session.id}
              className={`list-group-item list-group-item-action text-truncate ${
                selectedSessionId === session.id ? 'active' : ''
              }`}
              onClick={() => onSelectSession(session)}
              title={session.title}
            >
              {session.title || 'Untitled'}
            </button>
          ))}
        </div>

        {isAdmin && (
          <button
            className="btn btn-warning w-100 mb-4"
            onClick={onAdminClick}
          >
            {location.pathname === '/admin' ? 'Exit Admin View' : 'Admin View'}
          </button>
        )}
      </div>

      <div className="mt-auto">
        <UserBadge />
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger w-100 mt-3"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
