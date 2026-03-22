import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import Navbar from '../components/Navbar'

const levelColor = { Beginner: '#FDCB6E', Intermediate: '#6C63FF', Advanced: '#00D4AA' }

export default function Compare() {
  const [searchParams] = useSearchParams()
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ids.length >= 2) {
      api.get(`/recruiter/compare?ids=${ids.join(',')}`).then(res => {
        setProfiles(res.data.profiles)
        setLoading(false)
      }).catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const initials = (name) => (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const gradients = ['linear-gradient(135deg, #6C63FF, #00D4AA)', 'linear-gradient(135deg, #FF6B6B, #FFD93D)', 'linear-gradient(135deg, #4ECDC4, #556270)', 'linear-gradient(135deg, #F093FB, #F5576C)']

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  if (ids.length < 2) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Navbar />
      <div style={{ textAlign: 'center', marginTop: 80 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚖️</div>
        <h2 style={{ marginBottom: 8 }}>Select at least 2 candidates to compare</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Use the checkboxes on the dashboard to select candidates.</p>
        <Link to="/recruiter/dashboard" className="btn btn-primary">← Go to Dashboard</Link>
      </div>
    </div>
  )

  const allSkills = [...new Set(profiles.flatMap(p => p.skills.map(s => s.name)))]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '90px 24px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Compare Candidates</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Side-by-side comparison of {profiles.length} candidates</p>
          </div>
          <Link to="/recruiter/dashboard" className="btn btn-secondary btn-sm">← Back</Link>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${profiles.length}, 1fr)`, gap: 2, overflowX: 'auto' }}>
          {/* Header row */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius) 0 0 0', padding: 16 }} />
          {profiles.map((p, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', borderRadius: i === profiles.length - 1 ? '0 var(--radius) 0 0' : 0, padding: 20, textAlign: 'center', borderLeft: '1px solid var(--border-light)' }}>
              <div className="avatar" style={{ background: gradients[i], color: 'white', margin: '0 auto 12px', fontSize: '1.3rem' }}>{initials(p.user?.name)}</div>
              <h3 style={{ fontSize: '0.97rem', marginBottom: 4 }}>{p.user?.name}</h3>
              <p style={{ color: 'var(--primary-light)', fontSize: '0.8rem', marginBottom: 8 }}>{p.profile?.headline}</p>
              <Link to={`/recruiter/candidate/${p.user?.id}`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>View Full Profile</Link>
            </div>
          ))}

          {/* Location */}
          <CompareRow label="Location" profiles={profiles} getValue={p => p.profile?.location || '—'} />
          {/* Availability */}
          <CompareRow label="Availability" profiles={profiles} getValue={p => p.profile?.availability || '—'} isHighlight />
          {/* Completion */}
          <CompareRow label="Completion" profiles={profiles} render={(p) => (
            <div>
              <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{p.profile?.completion_percent || 0}%</div>
              <div className="progress-bar" style={{ height: 4 }}><div className="progress-fill" style={{ width: `${p.profile?.completion_percent || 0}%` }} /></div>
            </div>
          )} />
          {/* Experience count */}
          <CompareRow label="Experience" profiles={profiles} getValue={p => `${p.experiences?.length || 0} role${p.experiences?.length !== 1 ? 's' : ''}`} />
          {/* Projects */}
          <CompareRow label="Projects" profiles={profiles} getValue={p => `${p.projects?.length || 0} project${p.projects?.length !== 1 ? 's' : ''}`} />
          {/* Education */}
          <CompareRow label="Education" profiles={profiles} getValue={p => p.education?.[0] ? `${p.education[0].degree}, ${p.education[0].institution}` : '—'} />

          {/* Skills comparison */}
          <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)' }}>SKILLS</div>
          {profiles.map((_, i) => <div key={i} style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border-light)' }} />)}

          {allSkills.map(skillName => (
            <>
              <div key={`label-${skillName}`} style={{ background: 'var(--bg-card)', padding: '10px 16px', fontSize: '0.85rem', borderTop: '1px solid var(--border-light)' }}>{skillName}</div>
              {profiles.map((prof, i) => {
                const skill = prof.skills.find(s => s.name === skillName)
                return (
                  <div key={`${skillName}-${i}`} style={{ background: 'var(--bg-card)', padding: '10px 16px', textAlign: 'center', borderTop: '1px solid var(--border-light)', borderLeft: '1px solid var(--border-light)' }}>
                    {skill ? <span style={{ color: levelColor[skill.level], fontWeight: 700, fontSize: '0.8rem' }}>✓ {skill.level}</span> : <span style={{ color: 'var(--border)', fontSize: '0.9rem' }}>—</span>}
                  </div>
                )
              })}
            </>
          ))}

          {/* Action row */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '0 0 0 var(--radius)', padding: 16, borderTop: '2px solid var(--border)' }} />
          {profiles.map((p, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', borderRadius: i === profiles.length - 1 ? '0 0 var(--radius) 0' : 0, padding: 16, textAlign: 'center', borderTop: '2px solid var(--border)', borderLeft: '1px solid var(--border-light)' }}>
              <button className="btn btn-accent btn-sm" style={{ fontSize: '0.8rem' }}
                onClick={() => api.post('/recruiter/shortlist', { candidate_id: p.user?.id })}>
                ⭐ Shortlist
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CompareRow({ label, profiles, getValue, render, isHighlight }) {
  return (
    <>
      <div style={{ background: 'var(--bg-card)', padding: '12px 16px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center' }}>{label}</div>
      {profiles.map((prof, i) => (
        <div key={i} style={{ background: 'var(--bg-card)', padding: '12px 16px', borderTop: '1px solid var(--border-light)', borderLeft: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          {render ? render(prof) : (
            <span style={{ fontSize: '0.88rem', color: isHighlight ? 'var(--accent)' : 'var(--text)', fontWeight: isHighlight ? 600 : 400 }}>{getValue(prof)}</span>
          )}
        </div>
      ))}
    </>
  )
}
