import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { ToastContainer } from '../components/Toast'

const STEPS = [
  { id: 'basic', label: 'About You', icon: '👤' },
  { id: 'experience', label: 'Experience', icon: '💼' },
  { id: 'skills', label: 'Skills', icon: '⚡' },
  { id: 'projects', label: 'Projects', icon: '🚀' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'preview', label: 'Preview', icon: '✨' },
]

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const SKILL_CATEGORIES = ['Frontend', 'Backend', 'Language', 'Database', 'Cloud', 'DevOps', 'Tools', 'Design', 'ML/AI', 'Mobile', 'Other']

function SaveIndicator({ status }) {
  if (status === 'saving') return <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><span className="spinner spinner-sm" />Saving...</span>
  if (status === 'saved') return <span style={{ fontSize: '0.8rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>✓ Profile saved</span>
  return null
}

function AITypingIndicator() {
  return <div className="ai-typing" style={{ padding: '12px 16px' }}><span /><span /><span /></div>
}

// ── STEP 1: Basic Info ─────────────────────────────────────────────
function BasicStep({ data, onChange, onAISummary }) {
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')

  const generateSummary = async () => {
    if (!data.headline) return
    setAiLoading(true)
    setAiSuggestion('')
    try {
      const res = await api.post('/ai/generate-summary', {
        profile: { name: data.name, headline: data.headline, location: data.location }
      })
      setAiSuggestion(res.data.summary)
    } catch {}
    finally { setAiLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input className="form-input" value={data.name || ''} onChange={e => onChange('name', e.target.value)} placeholder="Alex Johnson" />
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <input className="form-input" value={data.location || ''} onChange={e => onChange('location', e.target.value)} placeholder="Bangalore, India" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Professional Headline *</label>
        <input className="form-input" value={data.headline || ''} onChange={e => onChange('headline', e.target.value)} placeholder="e.g. Full-Stack Developer | React & Node.js | Open to Work" />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>This appears at the top of your profile. Be specific and keyword-rich.</span>
      </div>

      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label className="form-label">Professional Summary</label>
          <button type="button" onClick={generateSummary} disabled={aiLoading || !data.headline}
            className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem', gap: 6 }}>
            {aiLoading ? <><span className="spinner spinner-sm" />Generating...</> : '✦ AI Generate Summary'}
          </button>
        </div>
        {aiLoading && <div className="ai-response-card"><AITypingIndicator /></div>}
        {aiSuggestion && !aiLoading && (
          <div className="ai-response-card" style={{ marginBottom: 10 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{aiSuggestion}</p>
            <button type="button" className="btn btn-accent btn-sm" style={{ marginTop: 12 }} onClick={() => { onChange('summary', aiSuggestion); setAiSuggestion('') }}>
              Use This Summary ✓
            </button>
          </div>
        )}
        <textarea className="form-textarea" value={data.summary || ''} onChange={e => onChange('summary', e.target.value)} placeholder="Write a brief professional summary or use AI to generate one..." rows={4} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" value={data.phone || ''} onChange={e => onChange('phone', e.target.value)} placeholder="+91 98765 43210" />
        </div>
        <div className="form-group">
          <label className="form-label">Availability</label>
          <select className="form-select" value={data.availability || 'Open to work'} onChange={e => onChange('availability', e.target.value)}>
            <option>Open to work</option>
            <option>Actively looking</option>
            <option>Casually exploring</option>
            <option>Not available</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        <div className="form-group">
          <label className="form-label">LinkedIn</label>
          <input className="form-input" value={data.linkedin || ''} onChange={e => onChange('linkedin', e.target.value)} placeholder="linkedin.com/in/you" />
        </div>
        <div className="form-group">
          <label className="form-label">GitHub</label>
          <input className="form-input" value={data.github || ''} onChange={e => onChange('github', e.target.value)} placeholder="github.com/you" />
        </div>
        <div className="form-group">
          <label className="form-label">Portfolio</label>
          <input className="form-input" value={data.portfolio || ''} onChange={e => onChange('portfolio', e.target.value)} placeholder="yoursite.com" />
        </div>
      </div>
    </div>
  )
}

// ── STEP 2: Experience ─────────────────────────────────────────────
function ExperienceStep({ data, onChange }) {
  const [rawText, setRawText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiParsed, setAiParsed] = useState(null)
  const [activeIdx, setActiveIdx] = useState(null)

  const addBlank = () => {
    onChange([...data, { job_title: '', company: '', location: '', start_date: '', end_date: '', is_current: false, description: '', bullets: [] }])
    setActiveIdx(data.length)
  }

  const remove = (i) => onChange(data.filter((_, idx) => idx !== i))

  const update = (i, field, value) => {
    const updated = [...data]
    updated[i] = { ...updated[i], [field]: value }
    onChange(updated)
  }

  const parseWithAI = async () => {
    if (!rawText.trim()) return
    setAiLoading(true)
    setAiParsed(null)
    try {
      const res = await api.post('/ai/parse-experience', { text: rawText })
      setAiParsed(res.data.experience)
    } catch (e) { console.error(e) }
    finally { setAiLoading(false) }
  }

  const acceptAIParsed = () => {
    onChange([...data, aiParsed])
    setAiParsed(null)
    setRawText('')
    setActiveIdx(data.length)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.4s ease' }}>
      {/* AI Parser Box */}
      <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.06), rgba(0,212,170,0.04))', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
        <h3 style={{ marginBottom: 6, fontSize: '1rem', color: 'var(--primary-light)' }}>✦ AI Experience Parser</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
          Describe your experience in plain English — AI will structure it automatically.
        </p>
        <textarea className="form-textarea" value={rawText} onChange={e => setRawText(e.target.value)} rows={3}
          style={{ marginBottom: 12 }}
          placeholder={`Example: "Worked at Google for 2 years as a software engineer. Built search features that improved performance by 40%. Led a team of 3 engineers."`}
        />
        <button type="button" className="btn btn-primary" onClick={parseWithAI} disabled={aiLoading || !rawText.trim()}>
          {aiLoading ? <><span className="spinner spinner-sm" />AI is parsing...</> : '✦ Parse with AI'}
        </button>

        {aiLoading && (
          <div className="ai-response-card" style={{ marginTop: 16 }}>
            <AITypingIndicator />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>Structuring your experience...</p>
          </div>
        )}

        {aiParsed && !aiLoading && (
          <div className="ai-response-card" style={{ marginTop: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><span style={{ color: 'var(--primary-light)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Role</span><br /><strong>{aiParsed.job_title}</strong></div>
              <div><span style={{ color: 'var(--primary-light)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Company</span><br /><strong>{aiParsed.company}</strong></div>
              <div><span style={{ color: 'var(--primary-light)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Location</span><br /><strong>{aiParsed.location}</strong></div>
              <div><span style={{ color: 'var(--primary-light)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Period</span><br /><strong>{aiParsed.start_date} → {aiParsed.is_current ? 'Present' : aiParsed.end_date}</strong></div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: 'var(--primary-light)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Achievements</span>
              <ul style={{ marginTop: 6, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {aiParsed.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-accent btn-sm" onClick={acceptAIParsed}>Add to Profile ✓</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAiParsed(null)}>Dismiss</button>
            </div>
          </div>
        )}
      </div>

      {/* Experience Cards */}
      {data.map((exp, i) => (
        <div key={i} className="card card-elevated" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, cursor: 'pointer' }} onClick={() => setActiveIdx(activeIdx === i ? null : i)}>
            <div>
              <strong>{exp.job_title || 'New Experience'}</strong>
              {exp.company && <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>@ {exp.company}</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {exp.is_current && <span className="badge badge-accent">Current</span>}
              <button type="button" onClick={(e) => { e.stopPropagation(); remove(i) }} className="btn btn-danger btn-sm btn-icon">✕</button>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{activeIdx === i ? '▲' : '▼'}</span>
            </div>
          </div>

          {activeIdx === i && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input className="form-input" value={exp.job_title} onChange={e => update(i, 'job_title', e.target.value)} placeholder="Software Engineer" />
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input className="form-input" value={exp.company} onChange={e => update(i, 'company', e.target.value)} placeholder="Google" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" value={exp.location} onChange={e => update(i, 'location', e.target.value)} placeholder="Remote" />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input className="form-input" type="month" value={exp.start_date} onChange={e => update(i, 'start_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input className="form-input" type="month" value={exp.end_date || ''} onChange={e => update(i, 'end_date', e.target.value)} disabled={exp.is_current} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={exp.is_current} onChange={e => update(i, 'is_current', e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                    Currently working here
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description / Achievements</label>
                <textarea className="form-textarea" value={exp.description} onChange={e => update(i, 'description', e.target.value)} rows={3} placeholder="Describe your role and key achievements..." />
              </div>
            </div>
          )}
        </div>
      ))}

      <button type="button" className="btn btn-secondary" onClick={addBlank} style={{ alignSelf: 'flex-start' }}>
        + Add Experience Manually
      </button>
    </div>
  )
}

// ── STEP 3: Skills ─────────────────────────────────────────────────
function SkillsStep({ data, onChange }) {
  const [role, setRole] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate', category: 'Technical' })

  const fetchSuggestions = async () => {
    setAiLoading(true)
    try {
      const res = await api.post('/ai/suggest-skills', { role, text: data.map(s => s.name).join(' ') })
      setSuggestions(res.data.suggestions.filter(s => !data.find(d => d.name === s)))
    } catch {}
    finally { setAiLoading(false) }
  }

  const addSuggested = (name) => {
    onChange([...data, { name, level: 'Intermediate', category: 'Technical' }])
    setSuggestions(prev => prev.filter(s => s !== name))
  }

  const addCustom = () => {
    if (!newSkill.name.trim()) return
    onChange([...data, { ...newSkill }])
    setNewSkill({ name: '', level: 'Intermediate', category: 'Technical' })
  }

  const remove = (i) => onChange(data.filter((_, idx) => idx !== i))
  const updateLevel = (i, level) => { const u = [...data]; u[i] = { ...u[i], level }; onChange(u) }

  const levelColor = { Beginner: 'var(--warning)', Intermediate: 'var(--primary-light)', Advanced: 'var(--accent)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.4s ease' }}>
      {/* AI Skill Suggester */}
      <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.06), rgba(0,212,170,0.04))', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
        <h3 style={{ marginBottom: 6, fontSize: '1rem', color: 'var(--primary-light)' }}>✦ AI Skill Suggestions</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>Enter your target role and AI will suggest relevant skills.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <input className="form-input" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Frontend Developer, Data Scientist..." style={{ flex: 1 }} />
          <button type="button" className="btn btn-primary" onClick={fetchSuggestions} disabled={aiLoading}>
            {aiLoading ? <><span className="spinner spinner-sm" />Thinking...</> : '✦ Suggest'}
          </button>
        </div>

        {aiLoading && <div className="ai-response-card" style={{ marginTop: 16 }}><AITypingIndicator /><p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>Analyzing role requirements...</p></div>}

        {suggestions.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 10 }}>Click to add to your profile:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {suggestions.map(s => (
                <button key={s} type="button" className="skill-chip" onClick={() => addSuggested(s)} style={{ cursor: 'pointer' }}>
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add skill manually */}
      <div className="card">
        <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Add Skill Manually</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Skill Name</label>
            <input className="form-input" value={newSkill.name} onChange={e => setNewSkill(p => ({ ...p, name: e.target.value }))} placeholder="React.js" onKeyDown={e => e.key === 'Enter' && addCustom()} />
          </div>
          <div className="form-group">
            <label className="form-label">Level</label>
            <select className="form-select" value={newSkill.level} onChange={e => setNewSkill(p => ({ ...p, level: e.target.value }))}>
              {SKILL_LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={newSkill.category} onChange={e => setNewSkill(p => ({ ...p, category: e.target.value }))}>
              {SKILL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button type="button" className="btn btn-accent" onClick={addCustom}>Add</button>
        </div>
      </div>

      {/* Current skills */}
      <div>
        <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Your Skills ({data.length})</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {data.map((skill, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 12px 6px 14px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{skill.name}</span>
              <select style={{ background: 'transparent', border: 'none', color: levelColor[skill.level] || 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                value={skill.level} onChange={e => updateLevel(i, e.target.value)}>
                {SKILL_LEVELS.map(l => <option key={l} style={{ background: 'var(--bg-card)' }}>{l}</option>)}
              </select>
              <button type="button" onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', padding: 0, lineHeight: 1 }}>✕</button>
            </div>
          ))}
          {data.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No skills added yet. Use AI suggestions or add manually.</p>}
        </div>
      </div>
    </div>
  )
}

// ── STEP 4: Projects ───────────────────────────────────────────────
function ProjectsStep({ data, onChange }) {
  const addBlank = () => onChange([...data, { title: '', description: '', tech_stack: [], live_url: '', github_url: '' }])
  const remove = (i) => onChange(data.filter((_, idx) => idx !== i))
  const update = (i, field, value) => { const u = [...data]; u[i] = { ...u[i], [field]: value }; onChange(u) }
  const updateTech = (i, techStr) => update(i, 'tech_stack', techStr.split(',').map(t => t.trim()).filter(Boolean))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>Your Projects</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Showcase work that demonstrates your skills.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={addBlank}>+ Add Project</button>
      </div>

      {data.map((proj, i) => (
        <div key={i} className="card card-elevated">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <strong>{proj.title || `Project ${i + 1}`}</strong>
            <button type="button" onClick={() => remove(i)} className="btn btn-danger btn-sm btn-icon">✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Project Title *</label>
              <input className="form-input" value={proj.title} onChange={e => update(i, 'title', e.target.value)} placeholder="SmartShop — E-commerce Platform" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={proj.description} onChange={e => update(i, 'description', e.target.value)} rows={3} placeholder="What does this project do? What problem does it solve?" />
            </div>
            <div className="form-group">
              <label className="form-label">Tech Stack (comma-separated)</label>
              <input className="form-input" value={Array.isArray(proj.tech_stack) ? proj.tech_stack.join(', ') : ''} onChange={e => updateTech(i, e.target.value)} placeholder="React, Node.js, MongoDB, Stripe" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Live URL</label>
                <input className="form-input" value={proj.live_url || ''} onChange={e => update(i, 'live_url', e.target.value)} placeholder="yourproject.com" />
              </div>
              <div className="form-group">
                <label className="form-label">GitHub URL</label>
                <input className="form-input" value={proj.github_url || ''} onChange={e => update(i, 'github_url', e.target.value)} placeholder="github.com/you/project" />
              </div>
            </div>
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🚀</div>
          <p style={{ marginBottom: 16 }}>Add your best projects to impress recruiters</p>
          <button type="button" className="btn btn-primary" onClick={addBlank}>Add Your First Project</button>
        </div>
      )}
    </div>
  )
}

// ── STEP 5: Education ──────────────────────────────────────────────
function EducationStep({ data, onChange }) {
  const addBlank = () => onChange([...data, { degree: '', field_of_study: '', institution: '', start_year: '', end_year: '', grade: '' }])
  const remove = (i) => onChange(data.filter((_, idx) => idx !== i))
  const update = (i, field, value) => { const u = [...data]; u[i] = { ...u[i], [field]: value }; onChange(u) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>Education</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Add your academic qualifications.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={addBlank}>+ Add Education</button>
      </div>

      {data.map((edu, i) => (
        <div key={i} className="card card-elevated">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <strong>{edu.degree || `Education ${i + 1}`}{edu.institution ? ` — ${edu.institution}` : ''}</strong>
            <button type="button" onClick={() => remove(i)} className="btn btn-danger btn-sm btn-icon">✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Degree</label>
                <input className="form-input" value={edu.degree} onChange={e => update(i, 'degree', e.target.value)} placeholder="B.Tech / B.E / MBA" />
              </div>
              <div className="form-group">
                <label className="form-label">Field of Study</label>
                <input className="form-input" value={edu.field_of_study} onChange={e => update(i, 'field_of_study', e.target.value)} placeholder="Computer Science" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Institution</label>
              <input className="form-input" value={edu.institution} onChange={e => update(i, 'institution', e.target.value)} placeholder="IIT Bombay / Bangalore Institute of Technology" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Start Year</label>
                <input className="form-input" value={edu.start_year} onChange={e => update(i, 'start_year', e.target.value)} placeholder="2020" type="number" min="1990" max="2030" />
              </div>
              <div className="form-group">
                <label className="form-label">End Year</label>
                <input className="form-input" value={edu.end_year} onChange={e => update(i, 'end_year', e.target.value)} placeholder="2024" type="number" min="1990" max="2030" />
              </div>
              <div className="form-group">
                <label className="form-label">Grade / CGPA</label>
                <input className="form-input" value={edu.grade} onChange={e => update(i, 'grade', e.target.value)} placeholder="8.5 CGPA" />
              </div>
            </div>
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎓</div>
          <p style={{ marginBottom: 16 }}>Add your educational qualifications</p>
          <button type="button" className="btn btn-primary" onClick={addBlank}>Add Education</button>
        </div>
      )}
    </div>
  )
}

// ── STEP 6: Preview ────────────────────────────────────────────────
function PreviewStep({ profile, onSubmit, submitting }) {
  const { basic, experiences, skills, projects, education } = profile
  const initials = (basic.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,170,0.05))', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 'var(--radius-xl)', padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div className="avatar avatar-xl" style={{ background: 'linear-gradient(135deg, #6C63FF, #00D4AA)', color: 'white' }}>{initials}</div>
          <div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: 4 }}>{basic.name || 'Your Name'}</h2>
            <p style={{ color: 'var(--primary-light)', fontWeight: 600, marginBottom: 6 }}>{basic.headline || 'Your Headline'}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {basic.location && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>📍 {basic.location}</span>}
              {basic.availability && <span className="badge badge-accent">{basic.availability}</span>}
            </div>
          </div>
        </div>

        {basic.summary && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>About</h3>
            <p style={{ color: 'var(--text)', lineHeight: 1.7 }}>{basic.summary}</p>
          </div>
        )}

        {skills.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Skills</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {skills.map((s, i) => <span key={i} className="skill-chip selected">{s.name}</span>)}
            </div>
          </div>
        )}

        {experiences.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Experience</h3>
            {experiences.map((e, i) => (
              <div key={i} style={{ marginBottom: 16, paddingLeft: 16, borderLeft: '2px solid var(--primary)' }}>
                <div style={{ fontWeight: 700 }}>{e.job_title}</div>
                <div style={{ color: 'var(--primary-light)', fontSize: '0.9rem', marginBottom: 4 }}>{e.company} {e.location ? `· ${e.location}` : ''}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{e.start_date} → {e.is_current ? 'Present' : e.end_date}</div>
              </div>
            ))}
          </div>
        )}

        {projects.length > 0 && (
          <div>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Projects</h3>
            {projects.map((p, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700 }}>{p.title}</div>
                {Array.isArray(p.tech_stack) && p.tech_stack.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {p.tech_stack.map((t, j) => <span key={j} className="badge badge-muted">{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <h3 style={{ marginBottom: 8 }}>Ready to Submit? 🎯</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>Your profile will be visible to recruiters on HireAI.</p>
        <button type="button" className="btn btn-accent btn-lg" onClick={onSubmit} disabled={submitting}>
          {submitting ? <><span className="spinner spinner-sm" />Submitting...</> : '🚀 Submit Profile to Recruiters'}
        </button>
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────
export default function ProfileBuilder() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saveStatus, setSaveStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [roleRecos, setRoleRecos] = useState([])
  const saveTimer = useRef(null)

  const [basic, setBasic] = useState({ name: user?.name || '', headline: '', summary: '', location: '', phone: '', linkedin: '', github: '', portfolio: '', availability: 'Open to work' })
  const [experiences, setExperiences] = useState([])
  const [skills, setSkills] = useState([])
  const [projects, setProjects] = useState([])
  const [education, setEducation] = useState([])

  // Load existing profile
  useEffect(() => {
    api.get('/profile').then(res => {
      const { user: u, profile: p, experiences: e, skills: s, projects: pr, education: edu } = res.data
      if (p) {
        setBasic({ name: u?.name || '', headline: p.headline || '', summary: p.summary || '', location: p.location || '', phone: p.phone || '', linkedin: p.linkedin || '', github: p.github || '', portfolio: p.portfolio || '', availability: p.availability || 'Open to work' })
      }
      if (e?.length) setExperiences(e)
      if (s?.length) setSkills(s)
      if (pr?.length) setProjects(pr)
      if (edu?.length) setEducation(edu)
    }).catch(() => {})
  }, [])

  const completion = Math.round(
    ((basic.headline ? 1 : 0) + (basic.summary ? 1 : 0) + (basic.name ? 1 : 0) + (experiences.length > 0 ? 1 : 0) + (skills.length >= 3 ? 1 : 0) + (projects.length > 0 ? 1 : 0) + (education.length > 0 ? 1 : 0)) / 7 * 100
  )

  // Debounced auto-save
  const autoSave = useCallback(async (section, payload) => {
    clearTimeout(saveTimer.current)
    setSaveStatus('saving')
    saveTimer.current = setTimeout(async () => {
      try {
        await api.put(`/profile/${section}`, payload)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(''), 3000)
      } catch {}
    }, 1500)
  }, [])

  const handleBasicChange = (field, value) => {
    const updated = { ...basic, [field]: value }
    setBasic(updated)
    autoSave('basic', updated)
  }

  const handleExperienceChange = (val) => {
    setExperiences(val)
    autoSave('experience', { experiences: val })
  }

  const handleSkillsChange = (val) => {
    setSkills(val)
    autoSave('skills', { skills: val })
    // Fetch role recommendations
    if (val.length >= 3) {
      api.post('/ai/recommend-roles', { skills: val, headline: basic.headline }).then(res => setRoleRecos(res.data.roles)).catch(() => {})
    }
  }

  const handleProjectsChange = (val) => { setProjects(val); autoSave('projects', { projects: val }) }
  const handleEducationChange = (val) => { setEducation(val); autoSave('education', { education: val }) }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await api.post('/ai/generate-summary', { profile: { name: basic.name, headline: basic.headline, location: basic.location, experiences, skills, projects } }).then(res => {
        if (res.data.summary && !basic.summary) {
          const updated = { ...basic, summary: res.data.summary }
          setBasic(updated)
          return api.put('/profile/basic', updated)
        }
      }).catch(() => {})

      await api.post('/profile/submit')
      navigate('/profile/view')
    } catch {
      setSubmitting(false)
    }
  }

  const steps = [
    { component: <BasicStep data={basic} onChange={handleBasicChange} />, validate: () => basic.name && basic.headline },
    { component: <ExperienceStep data={experiences} onChange={handleExperienceChange} />, validate: () => true },
    { component: <SkillsStep data={skills} onChange={handleSkillsChange} />, validate: () => skills.length >= 1 },
    { component: <ProjectsStep data={projects} onChange={handleProjectsChange} />, validate: () => true },
    { component: <EducationStep data={education} onChange={handleEducationChange} />, validate: () => true },
    { component: <PreviewStep profile={{ basic, experiences, skills, projects, education }} onSubmit={handleSubmit} submitting={submitting} />, validate: () => true },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <ToastContainer />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '100px 24px 60px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>AI Profile Builder</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Step {step + 1} of {STEPS.length} — {STEPS[step].label}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <SaveIndicator status={saveStatus} />
              <div style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 700 }}>{completion}% complete</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>

          {/* Step tabs */}
          <div style={{ display: 'flex', gap: 4, marginTop: 20, overflowX: 'auto', paddingBottom: 4 }}>
            {STEPS.map((s, i) => (
              <button key={i} type="button" onClick={() => i <= step && setStep(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                  borderRadius: 'var(--radius)', border: 'none', cursor: i <= step ? 'pointer' : 'not-allowed',
                  fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.2s',
                  background: i === step ? 'var(--primary)' : i < step ? 'rgba(0,212,170,0.1)' : 'var(--bg-card)',
                  color: i === step ? 'white' : i < step ? 'var(--accent)' : 'var(--text-muted)',
                  borderColor: i < step ? 'rgba(0,212,170,0.3)' : 'transparent',
                }}>
                <span>{s.icon}</span>
                <span>{s.label}</span>
                {i < step && <span>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Role recommendations banner */}
        {roleRecos.length > 0 && step === 2 && (
          <div className="ai-response-card" style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>✦ AI Role Recommendations based on your skills:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {roleRecos.map(r => <span key={r} className="badge badge-primary">{r}</span>)}
            </div>
          </div>
        )}

        {/* Step content */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 32, marginBottom: 32 }}>
          {steps[step].component}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setStep(p => p - 1)} disabled={step === 0}>
            ← Back
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            {STEPS.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i <= step ? 'var(--primary)' : 'var(--border)', transition: 'all 0.3s' }} />)}
          </div>
          {step < STEPS.length - 1 && (
            <button type="button" className="btn btn-primary" onClick={() => setStep(p => p + 1)}>
              {step === STEPS.length - 2 ? 'Preview Profile →' : 'Continue →'}
            </button>
          )}
          {step === STEPS.length - 1 && <div />}
        </div>
      </div>
    </div>
  )
}
