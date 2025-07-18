// src/components/ShellLayout.jsx
import Sidebar from './Sidebar'

export default function ShellLayout({ children }) {
  return (
    <div className="container-fluid vh-100 overflow-hidden">
      <div className="row h-100">
        {/* Sidebar */}
        <div className="col-12 col-md-3 col-lg-2 bg-light border-end p-3 d-flex flex-column h-100">
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="col position-relative p-0 overflow-auto px-4 pt-4 pb-5" style={{ height: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
