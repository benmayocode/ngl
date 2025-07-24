// frontend/src/App.jsx
import { useState } from 'react'
import { useIsAuthenticated, MsalProvider } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import { Routes, Route, Navigate } from 'react-router-dom'

import ChatPage from './pages/ChatPage'
import AdminView from './pages/AdminView'
import FlowEditor from './pages/FlowEditor'
import ShellLayout from './components/ShellLayout'
import LoginButton from './components/LoginButton'

import { useNodesState, useEdgesState } from 'reactflow'

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: '...',
    authority: 'https://login.microsoftonline.com/...',
    redirectUri: 'http://localhost:5173',
  },
})

function AuthenticatedApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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

      <Route
        path="/flow"
        element={
          <ShellLayout flowProps={{ nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange }}>
            {({ currentSession }) => (
              <FlowEditor
                currentSession={currentSession}
                nodes={nodes}
                setNodes={setNodes}
                onNodesChange={onNodesChange}
                edges={edges}
                setEdges={setEdges}
                onEdgesChange={onEdgesChange}
              />
            )}
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
