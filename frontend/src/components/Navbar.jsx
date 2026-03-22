import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ showLinks = true }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="url(#grad)" />
            <path d="M8 14h12M14 8l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="28" y2="28">
                <stop offset="0%" stopColor="#6C63FF" />
                <stop offset="100%" stopColor="#00D4AA" />
              </linearGradient>
            </defs>
          </svg>
          Hire<span>AI</span>
        </Link>

        {showLinks && (
          <div className="navbar-links">
            {user ? (
              <>
                {user.role === 'recruiter' && (
                  <>
                    <Link to="/recruiter/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
                    <Link to="/recruiter/shortlisted" className="btn btn-secondary btn-sm">Shortlisted</Link>
                  </>
                )}
                {user.role === 'candidate' && (
                  <>
                    <Link to="/profile/builder" className="btn btn-secondary btn-sm">My Profile</Link>
                    <Link to="/profile/view" className="btn btn-secondary btn-sm">Preview</Link>
                  </>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                  <div className="avatar" style={{ background: 'linear-gradient(135deg, #6C63FF, #00D4AA)', fontSize: '0.85rem' }}>
                    {initials}
                  </div>
                  <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm">Log in</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
