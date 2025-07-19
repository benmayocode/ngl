import { MsalProvider, useIsAuthenticated } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import LoginButton from './components/LoginButton'
import ChatPage from './pages/ChatPage'
import AdminView from './pages/AdminView'
import ShellLayout from './components/ShellLayout'

const tenantId = 'f127c5cd-9a16-463a-b4e8-41f0621a82fe'
const clientId = '9206cc0d-9ed6-4420-b454-274bc01d31b5'

const msalInstance = new PublicClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: 'http://localhost:5173',
  },
})

function AuthenticatedApp() {
  return (
    <Routes>
<Route
  path="/"
  element={
    <ShellLayout>
      {({ currentSession }) => <ChatPage currentSession={currentSession} />}
    </ShellLayout>
  }
/>

<Route
  path="/admin"
  element={
    <ShellLayout>
      {({ currentSession }) => <AdminView currentSession={currentSession} />}
    </ShellLayout>
  }
/>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function App() {
  const isAuthenticated = useIsAuthenticated()
  return isAuthenticated ? <AuthenticatedApp /> : <LoginButton />
}

export default function WrappedApp() {
  return (
    <MsalProvider instance={msalInstance}>
        <App />
    </MsalProvider>
  )
}
