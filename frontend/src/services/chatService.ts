import axios from 'axios'
import camelcaseKeys from 'camelcase-keys'
import { getApiRoot } from './apiConfig'

const sessionsBase = () => `${getApiRoot().replace(/\/+$/,'')}/sessions`


export async function fetchSessions(userEmail: string) {
  const res = await axios.get(`${sessionsBase()}?user_email=${encodeURIComponent(userEmail)}`)
  return res.data
}

export async function createSession({ userEmail, title }: {userEmail: string; title: string}) {
  const res = await axios.post(sessionsBase(), { user_email: userEmail, title })
  return res.data
}

export async function fetchMessages(sessionId: string) {
  const res = await axios.get(`${sessionsBase()}/${sessionId}/messages`)
  return camelcaseKeys(res.data, { deep: true })
}

export async function sendMessage(
  sessionId: string | null,
  role: string,
  content: string,
  sources: any[] = []
) {
  if (!sessionId) throw new Error('Session ID is required to send a message')

  const url = `${sessionsBase()}/${sessionId}/messages`
  console.log('POST', url)
  const res = await axios.post(url, { role, content, sources })

  if (res.data?.error) throw new Error(res.data.error)

  return { assistant: camelcaseKeys(res.data.assistant, { deep: true }) }
}

export async function deleteSession(sessionId: string) {
  const res = await axios.delete(`${sessionsBase()}/${sessionId}`)
  return res.data
}
