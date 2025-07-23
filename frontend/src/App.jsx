import { MsalProvider, useIsAuthenticated } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import LoginButton from './components/LoginButton'
import ChatPage from './pages/ChatPage'
import AdminView from './pages/AdminView'
import FlowEditor from './pages/FlowEditor'
import ShellLayout from './components/ShellLayout'

import ReactFlow, {
  useNodesState,
  useEdgesState,
} from 'reactflow';

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

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: 'input',
      type: 'input',
      position: { x: 50, y: 50 },
      data: { label: 'Input Node' },
    },
    {
      id: 'rewrite',
      type: 'prompt',
      position: { x: 250, y: 50 },
      data: {
        label: 'Prompt Node: Rewrite',
        template: 'Rewrite this professionally:\n\n{message}',
        onChange: (newTemplate) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === 'rewrite'
                ? { ...node, data: { ...node.data, template: newTemplate, onChange: node.data.onChange } }
                : node
            )
          );
        }
      },
    },
    {
      id: 'output',
      type: 'output',
      position: { x: 500, y: 50 },
      data: { label: 'Output Node' },
    }
  ]);

  const [edges, setEdges, onEdgesChange] = useEdgesState([
    { id: 'e1', source: 'input', target: 'rewrite' },
    { id: 'e2', source: 'rewrite', target: 'output' }
  ]);



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
          <ShellLayout
            flowProps={{ nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange }}
          >
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
