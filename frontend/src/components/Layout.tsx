// frontend/src/components/Layout.jsx
import { useState } from 'react'
import ChatHistory from './ChatHistory'
import type {Message} from '../types' 

export default function Layout() {
    const [input, setInput] = useState<string>('')
    const [chatHistory, setChatHistory] = useState<Array<Message>>([])
    const [loading, setLoading] = useState<boolean>(false)


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
                        <ChatHistory
                            chatHistory={chatHistory}
                            loading={loading}
                            
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
