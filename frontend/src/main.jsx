import React from 'react'
import './index.css'
import App from './App.jsx'
import './custom-bootstrap.scss'; // 👈 Your compiled version
// import './custom.css'; // <-- We'll add this next
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
