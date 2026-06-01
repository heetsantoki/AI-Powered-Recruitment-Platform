import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../utils/api'
import ShortlistModal from './ShortlistModal'

export default function Navbar({ showLinks = true }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeAlert, setActiveAlert] = useState(null)
  const dropdownRef = useRef(null)

  // Fetch notifications if user is candidate
  const fetchNotifications = () => {
    if (user && user.role === 'candidate') {
      api.get('/notifications')
        .then(res => setNotifications(res.data))
        .catch(err => console.error(err))
    }
  }

  useEffect(() => {
    fetchNotifications();

    // Poll notifications every 30 seconds for candidates
    let interval;
    if (user && user.role === 'candidate') {
      interval = setInterval(fetchNotifications, 30000);
    }
    return () => clearInterval(interval);
  }, [user]);

  // Click outside listener for notifications dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (n) => {
    handleMarkOneRead(n._id);
    setShowDropdown(false);
    setActiveAlert(n); // Open detailed Modal overlay!
  };

  const timeAgo = (dateStr) => {
    const diffMs = new Date() - new Date(dateStr);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

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

                    {/* Bell Icon & Dropdown */}
                    <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px 10px',
                          position: 'relative',
                          borderRadius: '50%',
                          width: 34,
                          height: 34,
                          marginLeft: 4
                        }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>🔔</span>
                        {unreadCount > 0 && (
                          <span style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            background: 'var(--danger)',
                            color: 'white',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            borderRadius: '50%',
                            minWidth: 16,
                            height: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 4px',
                            boxShadow: '0 0 10px rgba(225,112,85,0.4)',
                          }}>
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      {/* Dropdown list */}
                      {showDropdown && (
                        <div style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          right: 0,
                          zIndex: 2000,
                          background: 'rgba(19, 20, 43, 0.96)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          boxShadow: 'var(--shadow)',
                          width: 320,
                          maxHeight: 400,
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden'
                        }}>
                          {/* Header */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border-light)'
                          }}>
                            <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Notifications</span>
                            {unreadCount > 0 && (
                              <button
                                onClick={handleMarkAllRead}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--primary-light)',
                                  fontSize: '0.74rem',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  textDecoration: 'underline'
                                }}
                              >
                                Mark all as read
                              </button>
                            )}
                          </div>

                          {/* List */}
                          <div style={{ overflowY: 'auto', flex: 1 }} className="scroll-y">
                            {notifications.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: 8 }}>📭</span>
                                No notifications yet
                              </div>
                            ) : (
                              notifications.map((n) => (
                                <div
                                  key={n._id}
                                  onClick={() => handleNotificationClick(n)}
                                  style={{
                                    display: 'flex',
                                    gap: 12,
                                    padding: '14px 16px',
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    cursor: 'pointer',
                                    background: n.is_read ? 'transparent' : 'rgba(108, 99, 255, 0.05)',
                                    transition: 'all 0.2s',
                                    alignItems: 'flex-start'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(108, 99, 255, 0.05)'}
                                >
                                  {/* Company Logo Left */}
                                  <div style={{
                                    width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0
                                  }}>
                                    {n.company_logo ? (
                                      <img src={n.company_logo} alt={n.company_name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                      <span style={{ fontSize: '1.1rem' }}>🏢</span>
                                    )}
                                  </div>

                                  {/* Notification Info Text (Match User Specs) */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.84rem', display: 'block' }}>
                                      {n.company_name}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', display: 'block', marginTop: 2, lineHeight: 1.25 }}>
                                      Your profile has been shortlisted by this company.
                                    </span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginTop: 4 }}>
                                      {timeAgo(n.created_at)}
                                    </span>
                                  </div>
                                  {!n.is_read && (
                                    <span style={{
                                      width: 6, height: 6, borderRadius: '50%',
                                      background: 'var(--danger)', flexShrink: 0, marginTop: 6,
                                      boxShadow: '0 0 6px var(--danger)'
                                    }} />
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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

      {/* ─── INTERACTIVE DETAILED ALERT MODAL OVERLAY (PORTALED STANDALONE) ─── */}
      <AnimatePresence>
        {activeAlert && (
          <ShortlistModal activeAlert={activeAlert} onClose={() => setActiveAlert(null)} />
        )}
      </AnimatePresence>
    </nav>
  )
}
