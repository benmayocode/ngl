// src/components/ShellLayout.jsx
import { useState } from 'react'
import Sidebar from './Sidebar'

export default function ShellLayout({ children }) {

    const [currentSession, setCurrentSession] = useState(null)

    return (
        <div className="container-fluid vh-100 overflow-hidden">
            <div className="row h-100">
                <div className="col-12 col-md-3 col-lg-2 bg-light border-end p-3 d-flex flex-column h-100">
                    {currentSession?.id}
                    <Sidebar
                        selectedSessionId={currentSession?.id}
                        onSelectSession={setCurrentSession}
                    />
                </div>

                {/* Main content */}
                <div
                    id="main-content"
                    className="col position-relative p-0 overflow-auto px-4 pt-4 pb-5"
                    style={{ height: '100%' }}
                >
                    {children({ currentSession })}
                </div>
            </div>
        </div>
    )
}
