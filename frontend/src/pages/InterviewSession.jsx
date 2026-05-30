import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import Navbar from '../components/Navbar'
import { ToastContainer } from '../components/Toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function InterviewSession() {
  const navigate = useNavigate()
  const chatEndRef = useRef(null)
  
  // State
  const [interview, setInterview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roleInput, setRoleInput] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    fetchInterview()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [interview?.chat_history, sending])

  const fetchInterview = async () => {
    try {
      const res = await api.get('/interview')
      if (res.data.interview) {
        setInterview(res.data.interview)
        setRoleInput(res.data.interview.role)
      } else {
        // Fetch candidate basic profile to suggest target role
        const profileRes = await api.get('/profile')
        setRoleInput(profileRes.data.profile?.headline || 'Software Engineer')
      }
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const handleStart = async (e) => {
    e.preventDefault()
    if (!roleInput.trim()) return
    
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await api.post('/interview/start', { role: roleInput.trim() })
      setInterview(res.data.interview)
      setLoading(false)
    } catch (err) {
      setLoading(false)
      if (err.response?.status === 503) {
        setErrorMsg(err.response.data.error || 'Gemini API is not configured.')
      } else {
        setErrorMsg('Failed to initialize the interview. Please try again later.')
      }
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageInput.trim() || sending) return

    const tempMsg = messageInput.trim()
    setMessageInput('')
    setSending(true)

    // Optimistically update chat history for user reply
    setInterview(prev => ({
      ...prev,
      chat_history: [
        ...prev.chat_history,
        { sender: 'candidate', text: tempMsg, timestamp: new Date() }
      ]
    }))

    try {
      const res = await api.post('/interview/message', { message: tempMsg })
      setInterview(res.data.interview)
      setSending(false)
    } catch (err) {
      setSending(false)
      if (err.response?.status === 503) {
        setErrorMsg(err.response.data.error)
      } else {
        setErrorMsg('Communication failure with AI Technical Lead. Please reload the page.')
      }
    }
  }

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    )
  }

  // Define color mappings for scores
  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--accent)'
    if (score >= 60) return 'var(--warning)'
    return 'var(--danger)'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}
    >
      <Navbar />
      <ToastContainer />

      <div style={{ maxWidth: 940, margin: '0 auto', padding: '95px 24px 60px' }}>
        
        {/* Error Boundary Screen */}
        {errorMsg && (() => {
          const isBusy = errorMsg.includes('503') || 
                         errorMsg.toLowerCase().includes('busy') || 
                         errorMsg.toLowerCase().includes('demand') || 
                         errorMsg.toLowerCase().includes('temporarily') ||
                         errorMsg.toLowerCase().includes('offline') ||
                         errorMsg.toLowerCase().includes('unavailable');
          
          return (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="card card-elevated animate-in" 
              style={{ 
                textAlign: 'center', 
                padding: '40px 30px', 
                border: isBusy ? '1px solid rgba(253, 203, 110, 0.4)' : '1px solid rgba(225, 112, 85, 0.4)', 
                background: isBusy ? 'rgba(253, 203, 110, 0.03)' : 'rgba(225, 112, 85, 0.04)' 
              }}
            >
              <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>{isBusy ? '⏱' : '⚠️'}</div>
              <h2 style={{ fontSize: '1.4rem', color: isBusy ? 'var(--warning)' : 'var(--danger)', marginBottom: 12 }}>
                {isBusy ? 'AI Service Temporarily Busy' : 'AI Engine Offline'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.6 }}>
                {isBusy 
                  ? 'AI Interview service is temporarily busy due to high demand. Please wait a few seconds and try again.' 
                  : errorMsg}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <Link to="/profile/view" className="btn btn-secondary btn-sm">Return to Profile</Link>
                <button onClick={() => { setErrorMsg(''); fetchInterview(); }} className="btn btn-primary btn-sm">
                  {isBusy ? '🔄 Try Again Now' : 'Try Again'}
                </button>
              </div>
            </motion.div>
          )
        })()}

        {/* Not Started State */}
        {!errorMsg && !interview && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="card card-elevated"
            style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.06), rgba(0,212,170,0.03))' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <div className="float" style={{ fontSize: '3rem', display: 'inline-block', marginBottom: 12 }}>✦</div>
              <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: 8 }}>AI Role-Play Mini-Interview</h1>
              <p style={{ color: 'var(--text-secondary)', maxW: 600, margin: '0 auto' }}>
                Stand out to recruiters by completing a simulated technical and behavioral screening.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }} className="media-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-light)' }}>📋 Simulation Guidelines</h3>
                <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem' }}>
                  <li><strong>Targeted Topics:</strong> Gemini AI conducts a role-play technical exploration customized to your skills and projects.</li>
                  <li><strong>Format:</strong> Exactly 5 engaging, scenario-based questions focusing on engineering decisions.</li>
                  <li><strong>Timeline:</strong> Takes roughly 3-5 minutes. Please complete it in one session.</li>
                  <li><strong>Objective Assessment:</strong> On completion, the AI generates a structured validation scorecard visible to recruiters.</li>
                </ul>
              </div>

              <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
                <div className="form-group">
                  <label className="form-label">Confirm Target Job Role</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={roleInput}
                    onChange={e => setRoleInput(e.target.value)}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>
                    We pre-populate this from your headline. AI questions will be tailored to this exact title.
                  </small>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', padding: 14 }}
                >
                  🚀 Initialize AI screening
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Active Interview Screen */}
        {!errorMsg && interview && interview.status === 'in_progress' && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }} className="media-grid">
            
            {/* Left Sidebar */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="card" 
              style={{ display: 'flex', flexDirection: 'column', gap: 20, height: 'fit-content' }}
            >
              <div>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Interviewing</h3>
                <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>{interview.role}</span>
              </div>

              <div style={{ height: 1, background: 'var(--border-light)' }} />

              <div>
                <h4 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Progress</h4>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
                  Question {interview.current_question_index + 1} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 400 }}>of 5</span>
                </div>
                <div className="progress-bar" style={{ height: 6, marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${((interview.current_question_index + 1) / 5) * 100}%` }} />
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border-light)' }} />

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                🤖 <strong>AI Technical Lead:</strong> "Let's explore your choices, frameworks, and architecture. Give descriptive answers for best results."
              </div>

              <Link to="/profile/view" className="btn btn-secondary btn-sm" style={{ justifyContent: 'center', marginTop: 12 }}>
                🚪 Save & Exit
              </Link>
            </motion.div>

            {/* Right Chat Arena */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="card-elevated"
              style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', height: 560 }}
            >
              {/* Chat Header */}
              <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>✦</span>
                <strong style={{ fontSize: '0.95rem' }}>AI Technical screening Session</strong>
                <span className="badge badge-accent" style={{ fontSize: '0.7rem', marginLeft: 'auto' }}>LIVE</span>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <AnimatePresence initial={false}>
                  {interview.chat_history.map((msg, i) => {
                    const isAi = msg.sender === 'ai'
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 100 }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          alignSelf: isAi ? 'flex-start' : 'flex-end',
                          flexDirection: isAi ? 'row' : 'row-reverse',
                          maxWidth: '85%'
                        }}
                      >
                        <div
                          className="avatar"
                          style={{
                            width: 32,
                            height: 32,
                            fontSize: '0.8rem',
                            background: isAi ? 'linear-gradient(135deg, #6C63FF, #00D4AA)' : 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            color: 'white'
                          }}
                        >
                          {isAi ? '🤖' : '👤'}
                        </div>
                        <div
                          style={{
                            background: isAi ? 'rgba(108,99,255,0.06)' : 'var(--primary)',
                            border: isAi ? '1px solid var(--border)' : '1px solid transparent',
                            color: isAi ? 'var(--text)' : 'white',
                            padding: '12px 16px',
                            borderRadius: isAi ? '0 16px 16px 16px' : '16px 0 16px 16px',
                            fontSize: '0.9rem',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {msg.text}
                        </div>
                      </motion.div>
                    )
                  })}

                  {sending && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, alignSelf: 'flex-start' }}
                    >
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem', background: 'linear-gradient(135deg, #6C63FF, #00D4AA)', color: 'white' }}>
                        🤖
                      </div>
                      <div className="ai-response-card" style={{ padding: '12px 20px', minWidth: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="ai-typing" style={{ marginTop: 6 }}>
                          <span /><span /><span />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ padding: 16, background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 12, alignItems: 'center' }}>
                <textarea
                  className="form-input"
                  rows={1}
                  style={{ flex: 1, resize: 'none', height: 44, padding: '10px 14px', borderRadius: 'var(--radius)' }}
                  placeholder="Type your engineering response here..."
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                  disabled={sending}
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ padding: '0 20px', height: 44, borderRadius: 'var(--radius)' }}
                  disabled={!messageInput.trim() || sending}
                >
                  {sending ? <div className="spinner spinner-sm" /> : 'Send'}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Completed / Evaluation Screen */}
        {!errorMsg && interview && interview.status === 'completed' && (
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="animate-in"
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* Top overview card */}
            <div className="card card-elevated" style={{ display: 'flex', alignItems: 'center', gap: 30, flexWrap: 'wrap', background: 'linear-gradient(135deg, rgba(108,99,255,0.06), rgba(0,212,170,0.03))' }}>
              
              {/* Glowing Score Emblem */}
              <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} className="float">
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="70" cy="70" r="60" fill="transparent" stroke="var(--border-light)" strokeWidth="8" />
                  <circle 
                    cx="70" cy="70" r="60" fill="transparent" 
                    stroke={getScoreColor(interview.evaluation.score)} 
                    strokeWidth="8" 
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={2 * Math.PI * 60 * (1 - interview.evaluation.score / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ textAlign: 'center', zIndex: 1 }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                    {interview.evaluation.score}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.5 }}>
                    Match Score
                  </div>
                </div>
              </div>

              {/* Summary description */}
              <div style={{ flex: 1, minWidth: 260 }}>
                <span className="badge badge-accent" style={{ fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: 8 }}>
                  ✦ Assessment Complete
                </span>
                <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>Your AI Technical Evaluation</h1>
                <p style={{ color: 'var(--primary-light)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 12 }}>
                  Validated for the role of <strong>{interview.role}</strong>
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {interview.evaluation.validated_badges?.map((b, i) => (
                    <span key={i} className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                      ✦ {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Assessment Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }} className="media-grid">
              
              {/* Feedback and dynamic comments */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Overall Analysis
                </h3>
                <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                  {interview.evaluation.feedback}
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <Link to="/profile/view" className="btn btn-primary btn-sm">
                    View Verified Profile
                  </Link>
                  <button 
                    onClick={() => navigate('/profile/builder')} 
                    className="btn btn-secondary btn-sm"
                  >
                    Edit Profile Details
                  </button>
                </div>
              </div>

              {/* Strengths & Growth Areas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Strengths */}
                <div className="card" style={{ padding: 18, border: '1px solid rgba(0,212,170,0.15)', background: 'rgba(0,212,170,0.015)' }}>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                    Key Strengths
                  </h3>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none' }}>
                    {interview.evaluation.strengths?.map((s, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.88rem', color: 'var(--text)' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Growth Areas */}
                <div className="card" style={{ padding: 18, border: '1px solid rgba(253,203,110,0.15)', background: 'rgba(253,203,110,0.015)' }}>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                    Technical Growth Areas
                  </h3>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none' }}>
                    {interview.evaluation.growth_areas?.map((g, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>⚡</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Transcript Accordion */}
            <div className="card">
              <button 
                onClick={() => setShowTranscript(!showTranscript)}
                style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
              >
                <strong style={{ fontSize: '0.95rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  View Full Interview Dialogue Transcript
                </strong>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>{showTranscript ? '▲' : '▼'}</span>
              </button>
              
              <AnimatePresence>
                {showTranscript && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1, transition: { duration: 0.3 } }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}
                  >
                    <div style={{ height: 1, background: 'var(--border-light)', marginBottom: 6 }} />
                    {interview.chat_history.map((msg, i) => {
                      const isAi = msg.sender === 'ai'
                      return (
                        <div key={i} style={{ padding: 10, borderRadius: 'var(--radius-sm)', background: isAi ? 'rgba(255,255,255,0.01)' : 'rgba(108,99,255,0.03)', border: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            <strong>{isAi ? '🤖 AI Technical Lead' : '👤 Candidate Response'}</strong>
                            <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p style={{ fontSize: '0.88rem', color: isAi ? 'var(--text-secondary)' : 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            {msg.text}
                          </p>
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        )}

      </div>
    </motion.div>
  )
}
