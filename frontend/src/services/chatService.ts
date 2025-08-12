import axios from 'axios'
import camelcaseKeys from 'camelcase-keys'

const API_BASE = 'http://localhost:8000/api/sessions'

export async function fetchSessions(userEmail) {
  const res = await axios.get(`${API_BASE}?user_email=${encodeURIComponent(userEmail)}`)
  console.log("Fetched sessions:", res.data)
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
  console.log("Fetched messages for session:", sessionId, res.data)
  return camelcaseKeys(res.data, { deep: true })
}

export async function sendMessage(sessionId: string | null, role: string, content: string, sources: any[] = []) {
  if (!sessionId) {
    throw new Error("Session ID is required to send a message")
  }
  console.log("Sending message to session:", sessionId, { role, content, sources });

  const res = await axios.post(`${API_BASE}/${sessionId}/messages`, {
    role,
    content,
    sources,
  });
  console.log("Received response:", res);
  return {
    assistant: camelcaseKeys(res.data.assistant, { deep: true })
  };
}

export async function deleteSession(sessionId) {
  const res = await axios.delete(`${API_BASE}/${sessionId}`);
  return res.data;
}
