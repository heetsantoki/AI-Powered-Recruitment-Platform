import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { ToastContainer } from '../components/Toast'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.token, res.data.user)
      navigate(form.role === 'recruiter' ? '/recruiter/dashboard' : '/onboarding')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', position: 'relative', overflow: 'hidden', padding: '80px 24px' }}>
      <ToastContainer />
      <div style={{ position: 'absolute', top: '15%', right: '8%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, marginBottom: 12 }}>
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#grad3)" />
              <path d="M8 14h12M14 8l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <defs><linearGradient id="grad3" x1="0" y1="0" x2="28" y2="28"><stop offset="0%" stopColor="#6C63FF" /><stop offset="100%" stopColor="#00D4AA" /></linearGradient></defs>
            </svg>
            Hire<span style={{ color: 'var(--primary-light)' }}>AI</span>
          </Link>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Start building your AI-powered profile</p>
        </div>

        {/* Role Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
          {['candidate', 'recruiter'].map(role => (
            <button key={role} type="button"
              onClick={() => setForm(p => ({ ...p, role }))}
              style={{
                padding: '16px', borderRadius: 'var(--radius)', border: '2px solid',
                borderColor: form.role === role ? 'var(--primary)' : 'var(--border)',
                background: form.role === role ? 'rgba(108,99,255,0.1)' : 'var(--bg-card)',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                color: form.role === role ? 'var(--text)' : 'var(--text-secondary)'
              }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{role === 'candidate' ? '🎯' : '👔'}</div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'capitalize' }}>{role}</div>
              <div style={{ fontSize: '0.78rem', marginTop: 4, color: 'var(--text-muted)' }}>{role === 'candidate' ? 'Find your dream role' : 'Discover top talent'}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && (
            <div style={{ background: 'rgba(225,112,85,0.1)', border: '1px solid rgba(225,112,85,0.3)', borderRadius: 'var(--radius)', padding: '12px 16px', color: 'var(--danger)', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" placeholder="Alex Johnson" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="alex@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} minLength={6} required />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 4 }}>
            {loading ? <><span className="spinner spinner-sm" /> Creating account...</> : `Create ${form.role === 'recruiter' ? 'Recruiter' : 'Candidate'} Account →`}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 32, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
