// frontend/src/components/AuthForm.tsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { AuthError } from '@supabase/supabase-js'

export default function AuthForm() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const signUp = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const signInWithMagicLink = async () => {
    setLoading(true)
    setError(null)
    const { error }: { error: AuthError | null } = await supabase.auth.signInWithOtp({ email })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div>
      <h4>Login or Register</h4>
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="form-control mb-2"
      />
      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="form-control mb-2"
      />
      <button className="btn btn-primary me-2" onClick={signIn} disabled={loading}>
        Sign In
      </button>
      <button className="btn btn-secondary me-2" onClick={signUp} disabled={loading}>
        Sign Up
      </button>
      <button className="btn btn-link" onClick={signInWithMagicLink} disabled={loading}>
        Send Magic Link
      </button>
      {error && <p className="text-danger mt-2">{error}</p>}
    </div>
  )
}
