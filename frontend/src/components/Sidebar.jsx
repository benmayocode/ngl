import { useEffect, useState } from 'react'
import { fetchSessions, createSession } from '../services/chatService'
import { ADMIN_USERS } from '../constants/admins'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import UserBadge from './UserBadge'

export default function Sidebar({ selectedSessionId, onSelectSession }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const userEmail = user?.email
  const isAdmin = ADMIN_USERS.includes(userEmail)

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!userEmail) return;
      setLoading(true);
      const sessions = await fetchSessions(userEmail);
      setSessions(sessions);
      setLoading(false);
    };
    load();
  }, [userEmail]);


  const handleNewChat = async () => {
    const session = await createSession({ userEmail, title: 'New Chat' })
    setSessions((prev) => [session, ...prev])
    onSelectSession(session)
  }

  const onAdminClick = () => {
    navigate(location.pathname === '/admin' ? '/' : '/admin')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
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
          {loading ? (
            <div className="text-center py-2">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                className={`list-group-item list-group-item-action text-truncate ${selectedSessionId === session.id ? 'active' : ''
                  }`}
                onClick={() => onSelectSession(session)}
                title={session.title}
              >
                {session.title || 'Untitled'}
              </button>
            ))
          )}
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
