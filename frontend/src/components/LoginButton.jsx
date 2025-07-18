import { useMsal } from '@azure/msal-react'

export default function LoginButton() {
  const { instance } = useMsal()

  const handleLogin = () => {
    instance.loginRedirect({
      scopes: ['User.Read'],
    })
  }

  return (
    <button className="btn btn-primary" onClick={handleLogin}>
      Sign in with Microsoft
    </button>
  )
}
