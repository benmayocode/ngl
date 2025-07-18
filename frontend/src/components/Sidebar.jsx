import { useMsal } from '@azure/msal-react'
import { ADMIN_USERS } from '../constants/admins'
import { useNavigate, useLocation } from 'react-router-dom' // or your router of choice
import UserBadge from './UserBadge'

export default function Sidebar() {
  const { instance, accounts } = useMsal()
  const navigate = useNavigate()
  const location = useLocation()
  const userEmail = accounts[0]?.username
  const isAdmin = ADMIN_USERS.includes(userEmail)

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
        <button className="btn btn-outline-primary w-100 mb-3">+ New Chat</button>
        <div className="list-group mb-4">
          <button className="list-group-item list-group-item-action">Vacation Policy</button>
          <button className="list-group-item list-group-item-action">Payroll Questions</button>
          <button className="list-group-item list-group-item-action">IT Support</button>
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
        <button onClick={handleLogout} className="btn btn-outline-danger w-100 mt-3">
          Sign Out
        </button>
      </div>
    </div>
  )
}
