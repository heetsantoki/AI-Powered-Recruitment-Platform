import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { ToastContainer } from '../components/Toast'

const features = [
  { icon: '🧠', title: 'AI-Guided Profile Builder', desc: 'Just talk naturally about your experience. Our AI structures it into a polished, professional profile.' },
  { icon: '✨', title: 'Smart Skill Suggestions', desc: 'AI analyzes your experience and suggests the right skills for your profile and target roles.' },
  { icon: '📄', title: 'Instant Resume Generation', desc: 'Your profile auto-generates a beautiful, ATS-friendly resume PDF — no templates, no effort.' },
  { icon: '🎯', title: 'Role Recommendations', desc: 'Get personalized job role suggestions based on your unique skill set and experience.' },
  { icon: '📊', title: 'Recruiter Intelligence', desc: 'Hiring managers get structured candidate data — compare, filter, and shortlist with confidence.' },
  { icon: '🔗', title: 'Shareable Profile Link', desc: 'Share your profile with a single link. Control your narrative, not just a static PDF.' },
]

const stats = [
  { value: '10x', label: 'faster profile creation' },
  { value: '94%', label: 'better candidate matches' },
  { value: '0', label: 'resume uploads needed' },
]

export default function Landing() {
  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <ToastContainer />

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', paddingTop: 80 }}>
        {/* BG Orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 100, padding: '6px 16px', fontSize: '0.85rem', color: 'var(--primary-light)', marginBottom: 32, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            AI-Powered Recruitment — No Resumes Needed
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
            Your Career Story,{' '}
            <span className="gradient-text">Told by AI</span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Stop uploading outdated PDFs. HireAI lets you build a living, intelligent profile
            that showcases your true potential — guided every step by AI.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Build My Profile Free →
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Recruiter Login
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 48, justifyContent: 'center', flexWrap: 'wrap' }}>
            {stats.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-display)' }} className="gradient-text">{s.value}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section style={{ padding: '100px 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '2rem', marginBottom: 16 }}>Why Resumes <span style={{ color: 'var(--danger)' }}>Fail</span> Everyone</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Poor ATS parsing loses great candidates', 'Inconsistent formats cause recruiter fatigue', 'Static PDFs can\'t show real potential', 'Unconscious bias from resume layout/design', 'Outdated skills misrepresent candidates'].map(p => (
                  <div key={p} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--danger)', marginTop: 2 }}>✕</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '2rem', marginBottom: 16 }}>How HireAI <span className="gradient-text">Fixes It</span></h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['AI structures your experience perfectly every time', 'Standardized profiles equal fair comparison', 'Live profiles updated as you grow', 'Data-first approach reduces hiring bias', 'Smart recommendations surface the best fit'].map(p => (
                  <div key={p} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent)', marginTop: 2 }}>✓</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Interaction Demo */}
      <section style={{ padding: '100px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: 16 }}>Watch AI <span className="gradient-text">Structure Your Story</span></h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 56, maxWidth: 520, margin: '0 auto 56px' }}>Just describe your experience in plain language — AI does the rest.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'center', maxWidth: 900, margin: '0 auto' }}>
            <div className="card card-elevated" style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>You type:</div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>
                "Worked at Google for 2 years as a software engineer building search features and improving performance by 40%"
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>→</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', marginTop: 6 }}>AI Parses</div>
            </div>
            <div className="ai-response-card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div><strong style={{ color: 'var(--primary-light)' }}>Role:</strong> <span style={{ color: 'var(--text)' }}>Software Engineer</span></div>
                <div><strong style={{ color: 'var(--primary-light)' }}>Company:</strong> <span style={{ color: 'var(--text)' }}>Google</span></div>
                <div><strong style={{ color: 'var(--primary-light)' }}>Duration:</strong> <span style={{ color: 'var(--text)' }}>2 years</span></div>
                <div style={{ marginTop: 8 }}>
                  <strong style={{ color: 'var(--primary-light)' }}>Achievements:</strong>
                  <ul style={{ marginTop: 6, paddingLeft: 16, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <li>Built and scaled search feature infrastructure</li>
                    <li>Improved system performance by 40%</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: 56 }}>Everything You Need to <span className="gradient-text">Stand Out</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {features.map(f => (
              <div key={f.title} className="card" style={{ transition: 'all 0.3s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = ''; }}>
                <div style={{ fontSize: '2rem', marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(108,99,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 16 }}>Ready to <span className="gradient-text">Ditch the Resume?</span></h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 40, fontSize: '1.1rem' }}>Join thousands of candidates building smarter profiles with AI.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Start Building Free →
          </Link>
          <div style={{ marginTop: 24, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No credit card · No resume upload · Just you</div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-light)', padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <span>© 2025 HireAI. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 24 }}>
              <Link to="/login" style={{ color: 'var(--text-muted)' }}>Recruiter Login</Link>
              <Link to="/register" style={{ color: 'var(--text-muted)' }}>Candidate Sign Up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
