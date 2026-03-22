import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import Navbar from '../components/Navbar'
import { ToastContainer } from '../components/Toast'

export default function Shortlisted() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/recruiter/shortlisted').then(res => {
      setCandidates(res.data.candidates)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const removeShortlist = async (id) => {
    await api.post('/recruiter/shortlist', { candidate_id: id })
    setCandidates(prev => prev.filter(c => c.id !== id))
  }

  const initials = (name) => (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const statusColors = { shortlisted: 'var(--primary-light)', reviewed: 'var(--warning)', offered: 'var(--accent)', rejected: 'var(--danger)' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <ToastContainer />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '90px 24px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Shortlisted Candidates</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} in your list</p>
          </div>
          <Link to="/recruiter/dashboard" className="btn btn-secondary btn-sm">← All Candidates</Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2,3].map(i => <div key={i} className="card shimmer" style={{ height: 100 }} />)}
          </div>
        ) : candidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>⭐</div>
            <h3 style={{ marginBottom: 8 }}>No shortlisted candidates yet</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: 24 }}>Browse the talent pool and star candidates you're interested in.</p>
            <Link to="/recruiter/dashboard" className="btn btn-primary">Browse Candidates</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {candidates.map((c, idx) => (
              <div key={c.id} className="card card-elevated" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div className="avatar" style={{ background: `linear-gradient(135deg, ${['#6C63FF,#00D4AA', '#FF6B6B,#FFD93D', '#4ECDC4,#556270'][idx % 3]})`, color: 'white', flexShrink: 0 }}>{initials(c.name)}</div>

                <div style={{ flex: 1, minWidth: 180 }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: 2 }}>{c.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', marginBottom: 4 }}>{c.headline}</p>
                  {c.location && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>📍 {c.location}</p>}
                </div>

                {/* Skills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 240 }}>
                  {c.skills?.slice(0, 4).map((s, i) => <span key={i} className="badge badge-muted" style={{ fontSize: '0.72rem' }}>{s.name}</span>)}
                </div>

                {/* Status badge */}
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: statusColors[c.status] || 'var(--primary-light)', background: 'rgba(108,99,255,0.1)', padding: '4px 10px', borderRadius: 100, textTransform: 'capitalize' }}>{c.status || 'shortlisted'}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
                    {new Date(c.shortlisted_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Note */}
                {c.note && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', maxWidth: 160 }}>📝 {c.note}</div>}

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Link to={`/recruiter/candidate/${c.id}`} className="btn btn-primary btn-sm" style={{ fontSize: '0.82rem' }}>View</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => removeShortlist(c.id)} style={{ fontSize: '0.82rem' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
