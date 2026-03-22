import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import Navbar from '../components/Navbar'
import { ToastContainer } from '../components/Toast'

const levelColor = { Beginner: '#FDCB6E', Intermediate: '#6C63FF', Advanced: '#00D4AA' }

export default function RecruiterDashboard() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [skill, setSkill] = useState('')
  const [sort, setSort] = useState('newest')
  const [selected, setSelected] = useState([])

  useEffect(() => {
    fetchCandidates()
  }, [search, skill, sort])

  const fetchCandidates = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, skill, sort })
      const res = await api.get(`/recruiter/candidates?${params}`)
      setCandidates(res.data.candidates)
      setTotal(res.data.total)
    } catch {}
    finally { setLoading(false) }
  }

  const toggleShortlist = async (c) => {
    try {
      const res = await api.post('/recruiter/shortlist', { candidate_id: c.id })
      setCandidates(prev => prev.map(p => p.id === c.id ? { ...p, is_shortlisted: res.data.action === 'added' } : p))
    } catch {}
  }

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const initials = (name) => (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const avatarGradients = ['linear-gradient(135deg, #6C63FF, #00D4AA)', 'linear-gradient(135deg, #FF6B6B, #FFD93D)', 'linear-gradient(135deg, #4ECDC4, #556270)', 'linear-gradient(135deg, #F093FB, #F5576C)']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <ToastContainer />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '90px 24px 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Talent Pool</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{total} candidates available</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selected.length >= 2 && (
              <button className="btn btn-outline btn-sm" onClick={() => navigate(`/recruiter/compare?ids=${selected.join(',')}`)}>
                Compare {selected.length} Candidates
              </button>
            )}
            <Link to="/recruiter/shortlisted" className="btn btn-secondary btn-sm">⭐ Shortlisted</Link>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
            <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search by name, headline, summary..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input className="form-input" placeholder="Filter by skill..." value={skill} onChange={e => setSkill(e.target.value)} />
          <select className="form-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Sort: Newest</option>
            <option value="completion">Sort: Most Complete</option>
            <option value="name">Sort: Name A-Z</option>
          </select>
        </div>

        {/* Selected notice */}
        {selected.length > 0 && (
          <div style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--primary-light)', fontSize: '0.9rem' }}>{selected.length} candidate{selected.length > 1 ? 's' : ''} selected for comparison</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelected([])}>Clear</button>
          </div>
        )}

        {/* Candidates grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {[1,2,3,4].map(i => <div key={i} className="card shimmer" style={{ height: 200 }} />)}
          </div>
        ) : candidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: '1.1rem' }}>No candidates found</p>
            <p style={{ fontSize: '0.9rem', marginTop: 8 }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {candidates.map((c, idx) => (
              <div key={c.id} className="card" style={{
                position: 'relative', cursor: 'pointer',
                border: selected.includes(c.id) ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                transition: 'all 0.25s',
              }}
                onMouseEnter={e => { if (!selected.includes(c.id)) e.currentTarget.style.borderColor = 'var(--border)' }}
                onMouseLeave={e => { if (!selected.includes(c.id)) e.currentTarget.style.borderColor = 'var(--border-light)' }}
              >
                {/* Select checkbox */}
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }} />
                </div>

                {/* Header */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                  <div className="avatar" style={{ background: avatarGradients[idx % 4], color: 'white', flexShrink: 0 }}>{initials(c.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: 2 }}>{c.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.headline}</p>
                    {c.location && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>📍 {c.location}</p>}
                  </div>
                </div>

                {/* Completion bar */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Profile</span><span style={{ color: 'var(--accent)', fontWeight: 700 }}>{c.completion_percent}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 4 }}>
                    <div className="progress-fill" style={{ width: `${c.completion_percent}%` }} />
                  </div>
                </div>

                {/* Skills */}
                {c.skills?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                    {c.skills.slice(0, 4).map((s, i) => (
                      <span key={i} className="badge badge-muted" style={{ fontSize: '0.72rem' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: levelColor[s.level] || '#999', display: 'inline-block' }} />
                        {s.name}
                      </span>
                    ))}
                    {c.skills.length > 4 && <span className="badge badge-muted" style={{ fontSize: '0.72rem' }}>+{c.skills.length - 4}</span>}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/recruiter/candidate/${c.id}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem' }}>View Profile</Link>
                  <button className={`btn btn-sm ${c.is_shortlisted ? 'btn-accent' : 'btn-secondary'}`} style={{ fontSize: '0.82rem' }} onClick={() => toggleShortlist(c)}>
                    {c.is_shortlisted ? '⭐' : '☆'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
