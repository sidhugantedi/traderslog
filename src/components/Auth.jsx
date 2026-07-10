import { useState } from 'react'
import { sb } from '../lib/supabase'
import { LogoFull } from './Logo'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  async function handleSubmit() {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await sb.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Account created! You can now log in.')
        setMode('login')
      }
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot() {
    if (!email) { setError('Enter your email address first.'); return }
    const { error } = await sb.auth.resetPasswordForEmail(email)
    if (error) setError(error.message)
    else setSuccess('Password reset email sent. Check your inbox.')
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <LogoFull markSize={32} fontSize={20} dark={isDark} showTagline />
        </div>
        <div className="auth-title">Your trading journal</div>
        <div className="auth-sub">Log in or create your account to get started</div>
        <div className="auth-tabs">
          <div className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setError(''); setSuccess('') }}>Log In</div>
          <div className={`auth-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>Sign Up</div>
        </div>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <button className="btn btn-accent" style={{ width: '100%', padding: '11px', fontSize: '14px' }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>
        {mode === 'login' && (
          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text3)', cursor: 'pointer' }} onClick={handleForgot}>Forgot password?</span>
          </div>
        )}
      </div>
    </div>
  )
}
