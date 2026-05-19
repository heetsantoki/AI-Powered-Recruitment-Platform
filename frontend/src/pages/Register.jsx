import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { ToastContainer } from '../components/Toast'
import { motion } from 'framer-motion'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate' })
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
      const res = await api.post('/auth/register', form)
      if (res.data.requires_otp) {
        setShowOtp(true)
      } else if (res.data.token) {
        login(res.data.token, res.data.user)
        navigate(form.role === 'recruiter' ? '/recruiter/dashboard' : '/onboarding')
      }
    } catch (err) {
      if (!err.response) {
        setError('Network error — please check your internet connection and try again.')
      } else {
        setError(err.response?.data?.error || 'Registration failed.')
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
      navigate(form.role === 'recruiter' ? '/recruiter/dashboard' : '/onboarding')
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
        // Show role selection modal
        setGoogleUser({ ...res.data, idToken: credentialResponse.credential })
        setGoogleRole(form.role) // default to the one they already selected
        setShowRoleModal(true)
      } else {
        // Existing user, log them in
        login(res.data.token, res.data.user)
        navigate(res.data.user.role === 'recruiter' ? '/recruiter/dashboard' : '/profile/builder')
      }
    } catch (err) {
      if (!err.response) {
        setError('Network error — please check your internet connection and try again.')
      } else {
        setError(err.response?.data?.error || 'Google Sign-Up failed.')
      }
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
      navigate(res.data.user.role === 'recruiter' ? '/recruiter/dashboard' : '/onboarding')
    } catch (err) {
      if (!err.response) {
        setError('Network error — please check your internet connection and try again.')
      } else {
        setError(err.response?.data?.error || 'Registration failed.')
      }
    } finally {
      setLoading(false)
      setShowRoleModal(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', position: 'relative', overflow: 'hidden', padding: '80px 24px' }}>
      <ToastContainer />
      <div style={{ position: 'absolute', top: '15%', right: '8%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, delay: 0.1 }}
        style={{ width: '100%', maxWidth: 480, zIndex: 1 }}>
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
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              key={role} type="button"
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
            </motion.button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Sign-Up failed.')}
            text="signup_with"
          />
        </div>

        <div className="divider" style={{ marginBottom: 24 }}>or register manually</div>

        {showOtp ? (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ background: 'rgba(225,112,85,0.1)', border: '1px solid rgba(225,112,85,0.3)', borderRadius: 'var(--radius)', padding: '12px 16px', color: 'var(--danger)', fontSize: '0.9rem' }}>
                {error}
              </motion.div>
            )}
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', textAlign: 'center' }}>
              We sent a 6-digit verification code to <strong>{form.email}</strong>. Please enter it below.
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ background: 'rgba(225,112,85,0.1)', border: '1px solid rgba(225,112,85,0.3)', borderRadius: 'var(--radius)', padding: '12px 16px', color: 'var(--danger)', fontSize: '0.9rem' }}>
                {error}
              </motion.div>
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

            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 4, width: '100%' }}>
              {loading ? <><span className="spinner spinner-sm" /> Creating account...</> : `Create ${form.role === 'recruiter' ? 'Recruiter' : 'Candidate'} Account →`}
            </motion.button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 32, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign in</Link>
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
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.95rem' }}>Please confirm your role to complete registration.</p>
            
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
