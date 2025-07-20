import { useEffect, useRef, useState } from 'react'
import FileUploader from '../components/FileUploader'
import { useMsal } from '@azure/msal-react'
import axios from 'axios'
import { sendMessage } from '../services/chatService' // ⬅️ import it

export default function ChatInput({ input, setInput, chatHistory, setChatHistory, loading, setLoading, sessionId }) {
    const { instance, accounts } = useMsal()
    const [style, setStyle] = useState({ width: 0, left: 0 })
    const textareaRef = useRef(null)

    useEffect(() => {
        const updatePosition = () => {
            const container = document.getElementById('main-content')
            if (container) {
                const { offsetLeft, offsetWidth } = container
                setStyle({
                    width: offsetWidth * 0.75,
                    left: offsetLeft + offsetWidth * 0.125
                })
            }
        }

        updatePosition()
        window.addEventListener('resize', updatePosition)
        return () => window.removeEventListener('resize', updatePosition)
    }, [])

    // Auto-resize text area
    useEffect(() => {
        const textarea = textareaRef.current
        if (!textarea || input.length === 0) return

        const lineHeight = 24
        const minHeight = 2 * lineHeight
        const maxHeight = 6 * lineHeight

        textarea.style.height = 'auto'
        textarea.style.height = `${Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight))}px`

    }, [input])

    const handleChatSubmit = async (e) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMessage = input.trim()

        // Immediately append user message
        setChatHistory((prev) => [
            ...prev,
            { role: 'user', content: userMessage },
        ])
        await sendMessage(sessionId, 'user', userMessage)


        setInput('')     // clear the input
        setLoading(true) // trigger "GPT is thinking..."

        try {
            const result = await instance.acquireTokenSilent({
                scopes: ['User.Read'],
                account: accounts[0],
            })

            const res = await axios.post(
                '/api/chat',
                {
                    message: userMessage,
                    user_email: accounts[0].username,
                },
                {
                    headers: { Authorization: `Bearer ${result.accessToken}` },
                }
            )

            const botResponse = res.data.response
            const sources = res.data.sources || []
            // Append GPT response separately
            setChatHistory((prev) => [
                ...prev,
                { role: 'assistant', content: botResponse, sources },
            ])
            await sendMessage(sessionId, 'assistant', botResponse, sources)
        } catch (err) {
            setChatHistory((prev) => [
                ...prev,
                { role: 'assistant', content: 'Error: ' + err.message },
            ])

        }
        setLoading(false)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleChatSubmit(e)
        }
    }

    return (
        <div
            className="position-fixed bottom-0 mb-4"
            style={{
                position: 'fixed',
                width: style.width,
                left: style.left,
                zIndex: 1000,
            }}
        >
            <form onSubmit={handleChatSubmit}>
                <div className="position-relative bg-white rounded shadow border p-3">
                    <textarea
                        ref={textareaRef}
                        id="chat-input"
                        rows={2}
                        className="form-control border-0 shadow-none mb-2"
                        style={{
                            resize: 'none',
                            overflowY: 'auto',      // 👈 enable vertical scroll
                            maxHeight: '144px',     // 6 lines * 24px
                            minHeight: '48px',      // 2 lines
                            outline: 'none',
                            boxShadow: 'none',
                        }}
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />

                    <div className="d-flex justify-content-between align-items-center">
                        <FileUploader />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !input.trim()}
                        >
                            {loading ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
