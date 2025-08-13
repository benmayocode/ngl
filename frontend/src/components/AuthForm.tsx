// frontend/src/components/AuthForm.tsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { AuthError } from '@supabase/supabase-js'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async (fn: () => Promise<{ error: AuthError | null }>) => {
    setLoading(true)
    setError(null)
    const { error } = await fn()
    if (error) setError(error.message)
    setLoading(false)
  }

  const signIn = () =>
    handle(() => supabase.auth.signInWithPassword({ email, password }))

  const signUp = () =>
    handle(() => supabase.auth.signUp({ email, password }))

  const signInWithMagicLink = () =>
    handle(() => supabase.auth.signInWithOtp({ email }))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void signIn()
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body p-4">
          <div className="text-center mb-3">
            <h4 className="mb-1">NGL</h4>
            <small className="text-muted">AI thats Not Gonna Lie</small><br></br>
            <small className="text-muted"><small>** maybe **</small></small>

          </div>

          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label htmlFor="authEmail" className="form-label">Email</label>
              <input
                id="authEmail"
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-2">
              <label htmlFor="authPassword" className="form-label d-flex justify-content-between">
                <span>Password</span>
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0"
                  onClick={() => setShowPassword(s => !s)}
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </label>
              <div className="input-group">
                <input
                  id="authPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="d-grid gap-2 mt-3">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={signUp}
                disabled={loading}
              >
                {loading ? 'Please wait…' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="text-center my-3 position-relative">
            <hr className="m-0" />
            <span
              className="position-absolute top-50 start-50 translate-middle px-2 bg-white text-muted small"
              style={{ lineHeight: 1 }}
            >
              or
            </span>
          </div>

          <div className="d-grid">
            <button
              className="btn btn-light border"
              onClick={signInWithMagicLink}
              disabled={loading || !email}
              title={!email ? 'Enter your email first' : undefined}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Sending magic link…
                </>
              ) : (
                'Send Magic Link'
              )}
            </button>
          </div>

          <p className="text-muted small mt-3 mb-0 text-center">
            By continuing you agree to everything I say, do, think and feel.
          </p>
        </div>
      </div>
    </div>
  )
}
