import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import Navbar from '../components/Navbar'
import { ToastContainer } from '../components/Toast'

const levelColor = { Beginner: '#FDCB6E', Intermediate: '#6C63FF', Advanced: '#00D4AA' }

export default function CandidateView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [shortlisting, setShortlisting] = useState(false)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)

  useEffect(() => {
    api.get(`/recruiter/candidates/${id}`).then(res => {
      setData(res.data)
      setNote(res.data.shortlist?.note || '')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleShortlist = async () => {
    setShortlisting(true)
    try {
      const res = await api.post('/recruiter/shortlist', { candidate_id: parseInt(id), note })
      setData(prev => ({ ...prev, shortlist: res.data.action === 'added' ? { note } : null }))
      setShowNote(false)
    } catch {}
    finally { setShortlisting(false) }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!data) return <div className="loading-screen"><p style={{ color: 'var(--text-secondary)' }}>Candidate not found</p></div>

  const { user: u, profile: p, experiences, skills, projects, education } = data
  const initials = (u?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const isShortlisted = !!data.shortlist

  const skillsByCategory = {}
  skills.forEach(s => { if (!skillsByCategory[s.category]) skillsByCategory[s.category] = []; skillsByCategory[s.category].push(s) })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <ToastContainer />

      <div style={{ maxWidth: 840, margin: '0 auto', padding: '90px 24px 60px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <Link to="/recruiter/dashboard" style={{ color: 'var(--primary-light)' }}>← Back to Dashboard</Link>
        </div>

        {/* Profile Header */}
        <div className="card card-elevated" style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,170,0.04))', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            <div className="avatar avatar-xl" style={{ background: 'linear-gradient(135deg, #6C63FF, #00D4AA)', color: 'white', flexShrink: 0, fontSize: '2rem' }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontSize: '1.7rem', marginBottom: 4 }}>{u?.name}</h1>
              <p style={{ color: 'var(--primary-light)', fontWeight: 600, fontSize: '1rem', marginBottom: 10 }}>{p.headline}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, color: 'var(--text-secondary)', fontSize: '0.87rem', marginBottom: 12 }}>
                {p.location && <span>📍 {p.location}</span>}
                {u?.email && <span>📧 {u.email}</span>}
                {p.phone && <span>📱 {p.phone}</span>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {p.availability && <span className="badge badge-accent">{p.availability}</span>}
                <span className="badge badge-primary">Profile {p.completion_percent}% complete</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {p.linkedin && <a href={`https://${p.linkedin}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>LinkedIn</a>}
                {p.github && <a href={`https://${p.github}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>GitHub</a>}
                {p.portfolio && <a href={`https://${p.portfolio}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>Portfolio</a>}
              </div>
            </div>

            {/* Shortlist actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, minWidth: 140 }}>
              <button className={`btn ${isShortlisted ? 'btn-secondary' : 'btn-accent'}`} onClick={() => setShowNote(!showNote)} disabled={shortlisting}>
                {isShortlisted ? '⭐ Shortlisted' : '☆ Shortlist'}
              </button>
              {showNote && (
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
                  <textarea className="form-textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..." rows={2} style={{ marginBottom: 8, fontSize: '0.85rem' }} />
                  <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }} onClick={handleShortlist} disabled={shortlisting}>
                    {isShortlisted ? 'Remove' : 'Confirm'}
                  </button>
                </div>
              )}
              {isShortlisted && data.shortlist?.note && (
                <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-sm)', padding: 10, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  📝 {data.shortlist.note}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        {p.summary && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>About</h2>
            <p style={{ color: 'var(--text)', lineHeight: 1.8 }}>{p.summary}</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Skills ({skills.length})</h2>
            {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>{cat}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {catSkills.map((s, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: 'var(--bg-input)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: levelColor[s.level] || '#999' }} />
                      {s.name}
                      <span style={{ color: levelColor[s.level], fontSize: '0.72rem', fontWeight: 700 }}>{s.level}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Experience</h2>
            {experiences.map((exp, i) => (
              <div key={i} style={{ paddingLeft: 18, borderLeft: '2px solid var(--primary)', marginBottom: 20, position: 'relative' }}>
                <div style={{ position: 'absolute', left: -5, top: 6, width: 8, height: 8, borderRadius: '50%', background: exp.is_current ? 'var(--accent)' : 'var(--primary)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: 2 }}>{exp.job_title}</h3>
                    <div style={{ color: 'var(--primary-light)', fontSize: '0.9rem', fontWeight: 600 }}>{exp.company}</div>
                    {exp.location && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>📍 {exp.location}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {exp.is_current && <span className="badge badge-accent" style={{ marginBottom: 4, display: 'block' }}>Current</span>}
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{exp.start_date} → {exp.is_current ? 'Present' : exp.end_date}</div>
                  </div>
                </div>
                {exp.bullets?.length > 0 && (
                  <ul style={{ paddingLeft: 16, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8, marginTop: 10 }}>
                    {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Projects</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {projects.map((proj, i) => (
                <div key={i} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius)', padding: 18, border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '0.97rem', marginBottom: 8 }}>{proj.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 10 }}>{proj.description}</p>
                  {proj.tech_stack?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>{proj.tech_stack.map((t, j) => <span key={j} className="badge badge-muted" style={{ fontSize: '0.72rem' }}>{t}</span>)}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {proj.live_url && <a href={`https://${proj.live_url}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>🔗 Live</a>}
                    {proj.github_url && <a href={`https://${proj.github_url}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>⚙ GitHub</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="card">
            <h2 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Education</h2>
            {education.map((edu, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 2 }}>{edu.degree} in {edu.field_of_study}</h3>
                  <p style={{ color: 'var(--primary-light)', fontSize: '0.9rem' }}>{edu.institution}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{edu.start_year} – {edu.end_year}</div>
                  {edu.grade && <span className="badge badge-accent" style={{ marginTop: 4, display: 'inline-block' }}>{edu.grade}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
