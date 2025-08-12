import { useEffect, useState } from 'react'
import { fetchSessions, createSession } from '../services/chatService'
import { ADMIN_USERS } from '../constants/admins'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { deleteSession } from '../services/chatService'
import UserBadge from './UserBadge'
import { useShell } from './ShellLayout'

export default function Sidebar() {

  const { currentSession, setChatHistory, onSelectSession } = useShell()
  const selectedSessionId = currentSession?.id || null

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

  const handleDeleteSession = async (sessionId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this chat?");
    if (!confirmDelete) { setChatHistory([]); return; }

    await deleteSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

    if (selectedSessionId === sessionId) {
      onSelectSession(null); // clear selection if deleted
    }
  };

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
              <div
                key={session.id}
                className={`list-group-item d-flex justify-content-between align-items-center ${selectedSessionId === session.id ? 'active' : ''
                  }`}
                title={session.title}
                onClick={() => onSelectSession(session)}
                style={{ cursor: 'pointer' }}
              >
                <span className="text-truncate me-2" style={{ maxWidth: '80%' }}>
                  {session.title || 'Untitled'}
                </span>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                  title="Delete chat"
                >
                  &times;
                </button>
              </div>
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

        {/* Flow View button */}
        <button
          className="btn btn-info w-100 mb-4"
          onClick={() => {
            navigate(location.pathname === '/flow' ? '/' : '/flow')
          }}
        >
          {location.pathname === '/flow' ? 'Exit Flow View' : 'Flow View'}
        </button>

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
