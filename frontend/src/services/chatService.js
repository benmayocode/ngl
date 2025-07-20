import axios from 'axios'

const API_BASE = '/api/sessions'

export async function fetchSessions(userEmail) {
  const res = await axios.get(`${API_BASE}?user_email=${encodeURIComponent(userEmail)}`)
  return res.data
}

export async function createSession({ userEmail, title }) {
  const res = await axios.post(API_BASE, {
    user_email: userEmail,
    title,
  })
  return res.data
}

export async function fetchMessages(sessionId) {
  const res = await axios.get(`${API_BASE}/${sessionId}/messages`)
  return res.data
}

export async function sendMessage(sessionId, role, content, sources = []) {
  console.log("Sending message to session:", sessionId, { role, content, sources })

  const res = await axios.post(`${API_BASE}/${sessionId}/messages`, {
    role,
    content,
    sources,
  })
  return res.data
}
