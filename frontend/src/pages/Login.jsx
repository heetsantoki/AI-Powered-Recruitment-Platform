import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { ToastContainer } from '../components/Toast'
import { motion } from 'framer-motion'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState('')
  const [googleUser, setGoogleUser] = useState(null)
  const [googleRole, setGoogleRole] = useState('candidate')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }

    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token, res.data.user)
      navigate(res.data.user.role === 'recruiter' ? '/recruiter/dashboard' : '/profile/builder')
    } catch (err) {
      if (err.response?.data?.requires_otp) {
        setShowOtp(true)
        setError(err.response?.data?.error || 'Verification required.')
      } else {
        setError(err.response?.data?.error || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/auth/verify-otp', { email: form.email, otp })
      login(res.data.token, res.data.user)
      navigate(res.data.user.role === 'recruiter' ? '/recruiter/dashboard' : '/profile/builder')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true)
      setError('')
      const res = await api.post('/auth/google', { idToken: credentialResponse.credential })
      if (res.status === 202) {
        setGoogleUser({ ...res.data, idToken: credentialResponse.credential })
        setShowRoleModal(true)
      } else {
        login(res.data.token, res.data.user)
        navigate(res.data.user.role === 'recruiter' ? '/recruiter/dashboard' : '/profile/builder')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Google Sign-In failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    try {
      setLoading(true)
      const res = await api.post('/auth/google/register', { 
        idToken: googleUser.idToken,
        role: googleRole 
      })
      login(res.data.token, res.data.user)
      navigate(res.data.user.role === 'recruiter' ? '/recruiter/dashboard' : '/profile/builder')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.')
    } finally {
      setLoading(false)
      setShowRoleModal(false)
    }
  }

  const fillDemo = (role) => {
    if (role === 'candidate') setForm({ email: 'hire-me@anshumat.org', password: 'HireMe@2025!' })
    else setForm({ email: 'recruiter@demo.com', password: 'HireMe@2025!' })
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <ToastContainer />
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, delay: 0.1 }}
        style={{ width: '100%', maxWidth: 440, padding: '0 24px', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, marginBottom: 12 }}>
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#grad2)" />
              <path d="M8 14h12M14 8l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <defs><linearGradient id="grad2" x1="0" y1="0" x2="28" y2="28"><stop offset="0%" stopColor="#6C63FF" /><stop offset="100%" stopColor="#00D4AA" /></linearGradient></defs>
            </svg>
            Hire<span style={{ color: 'var(--primary-light)' }}>AI</span>
          </Link>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Sign in to continue your journey</p>
        </div>

        {/* Demo Quick Login */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => fillDemo('candidate')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem', justifyContent: 'center', width: '100%' }}>
            🎯 Demo Candidate
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => fillDemo('recruiter')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem', justifyContent: 'center', width: '100%' }}>
            👔 Demo Recruiter
          </motion.button>
        </div>

        <div className="divider">or sign in manually</div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Sign-In failed.')}
            useOneTap
          />
        </div>

        {showOtp ? (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ background: 'rgba(225,112,85,0.1)', border: '1px solid rgba(225,112,85,0.3)', borderRadius: 'var(--radius)', padding: '12px 16px', color: 'var(--danger)', fontSize: '0.9rem' }}>
                {error}
              </motion.div>
            )}
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', textAlign: 'center' }}>
              We sent a new 6-digit verification code to <strong>{form.email}</strong>. Please enter it below to verify your account.
            </p>

            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <input className="form-input" type="text" placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} required style={{ textAlign: 'center', letterSpacing: 4, fontSize: '1.2rem', fontWeight: 600 }} />
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 4, width: '100%' }}>
              {loading ? <><span className="spinner spinner-sm" /> Verifying...</> : 'Verify & Continue →'}
            </motion.button>
            <button type="button" onClick={handleSubmit} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', marginTop: 8 }}>
              Resend Code
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ background: 'rgba(225,112,85,0.1)', border: '1px solid rgba(225,112,85,0.3)', borderRadius: 'var(--radius)', padding: '12px 16px', color: 'var(--danger)', fontSize: '0.9rem' }}>
                {error}
              </motion.div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Your password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 8, width: '100%' }}>
              {loading ? <><span className="spinner spinner-sm" /> Signing in...</> : 'Sign In →'}
            </motion.button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 32, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Create one free</Link>
        </p>
      </motion.div>

      {/* Role Selection Modal for New Google Users */}
      {showRoleModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring' }}
            style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginBottom: 8, fontSize: '1.4rem' }}>Welcome, {googleUser?.name}!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.95rem' }}>Please select your role to complete registration.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {['candidate', 'recruiter'].map(role => (
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  key={role} type="button"
                  onClick={() => setGoogleRole(role)}
                  style={{
                    padding: '16px 12px', borderRadius: 'var(--radius)', border: '2px solid',
                    borderColor: googleRole === role ? 'var(--primary)' : 'var(--border)',
                    background: googleRole === role ? 'rgba(108,99,255,0.1)' : 'var(--bg)',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                    color: googleRole === role ? 'var(--text)' : 'var(--text-secondary)'
                  }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{role === 'candidate' ? '🎯' : '👔'}</div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '0.95rem' }}>{role}</div>
                </motion.button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-secondary" onClick={() => setShowRoleModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-primary" onClick={handleGoogleRegister} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? 'Creating...' : 'Continue →'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
