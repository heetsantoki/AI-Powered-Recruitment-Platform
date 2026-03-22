import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const steps = [
  { icon: '👋', title: 'No Resumes Here', desc: 'Forget uploading PDFs. HireAI builds your profile through smart conversations — guided by AI every step of the way.' },
  { icon: '🧠', title: 'AI Understands You', desc: 'Just describe your experience in plain English. Our AI parses, structures, and polishes it into a professional profile.' },
  { icon: '✨', title: 'Skills Get Smarter', desc: 'AI suggests the right skills based on your experience and target roles — no more guessing what to include.' },
  { icon: '🚀', title: 'Ready to Launch?', desc: "Your profile is shared with top recruiters the moment you submit. Let's build something great together." },
]

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Orbs */}
      <div style={{ position: 'absolute', top: '5%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>
          <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="url(#grad4)" />
            <path d="M8 14h12M14 8l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <defs><linearGradient id="grad4" x1="0" y1="0" x2="28" y2="28"><stop offset="0%" stopColor="#6C63FF" /><stop offset="100%" stopColor="#00D4AA" /></linearGradient></defs>
          </svg>
          Hire<span style={{ color: 'var(--primary-light)' }}>AI</span>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Hey {user?.name?.split(' ')[0] || 'there'}, welcome aboard! 👋</div>
      </div>

      <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: 16, maxWidth: 580 }}>
        Let's Build Your{' '}
        <span className="gradient-text">Smart Profile</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 480, marginBottom: 56, fontSize: '1.05rem', lineHeight: 1.7 }}>
        In just a few minutes, you'll have a professional profile that speaks for you — no resume upload needed.
      </p>

      {/* Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, maxWidth: 900, width: '100%', marginBottom: 56 }}>
        {steps.map((step, i) => (
          <div key={i} className="card" style={{ textAlign: 'left', position: 'relative', animation: `fadeIn 0.5s ease ${i * 0.1}s forwards`, opacity: 0 }}>
            <div style={{ position: 'absolute', top: 16, right: 16, fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-light)', background: 'rgba(108,99,255,0.1)', borderRadius: 100, padding: '2px 8px' }}>
              {i + 1}
            </div>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>{step.icon}</div>
            <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>{step.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', lineHeight: 1.6 }}>{step.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/profile/builder')}>
          Start Building My Profile →
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Takes about 5 minutes · Auto-saved throughout</span>
      </div>
    </div>
  )
}
