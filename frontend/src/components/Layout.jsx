// frontend/src/components/Layout.jsx
import { useState } from 'react'
import ChatUI from './ChatUI'
import axios from 'axios'


export default function Layout() {
    const [input, setInput] = useState('')
    const [chatHistory, setChatHistory] = useState([])
    const [loading, setLoading] = useState(false)


    return (
        <div className="container-fluid vh-100 overflow-hidden">
            <div className="row h-100">
                {/* Sidebar */}
                <div className="col-12 col-md-3 col-lg-2 bg-light border-end p-3">
                    {/* <Sidebar /> */}
                </div>

                {/* Main */}
                <div className="col position-relative p-0">
                    {/* Scrollable chat area */}
                    <div className="overflow-auto px-4 pt-4 pb-5" style={{ height: '100%', paddingBottom: '7rem' }}>
                        <ChatUI
                            input={input}
                            setInput={setInput}
                            chatHistory={chatHistory}
                            loading={loading}
                            setLoading={setLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
