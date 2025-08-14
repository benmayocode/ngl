// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'

import ChatPage from './pages/ChatPage'
import AdminView from './pages/AdminView'
import FlowEditor from './pages/FlowEditor'
import ShellLayout from './components/ShellLayout'
import FlowShellLayout from './components/FlowShellLayout'
import { useNodesState, useEdgesState } from 'reactflow'

import { useAuth } from './context/AuthContext'
import AuthForm from './components/AuthForm' // or wherever you placed your login form

function AuthenticatedApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ShellLayout>
            <ChatPage />
          </ShellLayout>
        }
      />

      <Route
        path="/admin"
        element={
          <ShellLayout>
            <AdminView />
          </ShellLayout>
        }
      />

      <Route
        path="/flow"
        element={
          <FlowShellLayout setNodes={setNodes}>

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
          </FlowShellLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function App() {
  const { user } = useAuth()

  return user ? <AuthenticatedApp /> : <AuthForm />
}

export default App
