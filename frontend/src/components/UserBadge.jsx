import { useMsal } from '@azure/msal-react'

export default function UserBadge() {
  const { accounts } = useMsal()
  const user = accounts[0]
  const claims = user?.idTokenClaims || {}

  const isValidName = (name) => {
    return name && !/^[a-f0-9- ]{30,}$/i.test(name)
  }

  const email = user.username
  const displayName = isValidName(user.name) ? user.name : claims.preferred_username || email
  const showName = displayName !== email

  const getInitials = (value) => {
    const base = displayName || email
    const parts = base.split('@')[0].split(/[.\s_-]/)
    return parts
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('')
  }

  const initials = getInitials(displayName)

  return (
    <div className="d-flex align-items-center gap-3 p-2 border rounded bg-light">
      <div
        className="d-flex justify-content-center align-items-center rounded-circle bg-primary text-white"
        style={{ width: '40px', height: '40px', fontWeight: 'bold' }}
      >
        {initials}
      </div>
      <div className="text-start">
        {showName && <div style={{ fontWeight: 600 }}>{displayName}</div>}
        <div style={{ fontSize: '0.875rem', color: '#666' }}>{email}</div>
      </div>
    </div>
  )
}
