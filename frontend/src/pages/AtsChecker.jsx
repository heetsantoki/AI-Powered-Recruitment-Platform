import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { ToastContainer, useToast } from '../components/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../utils/api'

export default function AtsChecker() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [analysis, setAnalysis] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const { show: toast } = useToast()

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return
    if (selectedFile.type !== 'application/pdf') {
      toast('Please upload a PDF file only.', 'error')
      return
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast('Resume file size must be less than 5MB.', 'error')
      return
    }
    setFile(selectedFile)
    toast(`Loaded ${selectedFile.name}`, 'info')
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      toast('Please select a resume file first.', 'error')
      return
    }

    setLoading(true)
    setLoadingStep(0)

    // Simulate analysis stages for better user engagement and premium feel
    const stepIntervals = [
      setTimeout(() => setLoadingStep(1), 1200), // Parsing PDF
      setTimeout(() => setLoadingStep(2), 2400), // Extracting skills
      setTimeout(() => setLoadingStep(3), 3600), // Scoring formatting
    ]

    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        try {
          const base64 = reader.result.split(',')[1]
          const res = await api.post('/ai/public/ats-check', { resumeBase64: base64 })
          
          // Clear standard simulation intervals if done faster
          stepIntervals.forEach(clearTimeout)
          setLoadingStep(4) // Completed
          
          setTimeout(() => {
            setAnalysis(res.data.analysis)
            setLoading(false)
            toast('ATS Score analysis completed successfully!', 'success')
          }, 600)
        } catch (err) {
          stepIntervals.forEach(clearTimeout)
          setLoading(false)
          toast(err.response?.data?.error || 'Failed to analyze resume. Please try again.', 'error')
        }
      }
    } catch (err) {
      stepIntervals.forEach(clearTimeout)
      setLoading(false)
      toast('Failed to read resume file. Make sure it is not corrupted.', 'error')
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--accent)'
    if (score >= 60) return 'var(--warning)'
    return 'var(--danger)'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent ATS Compatibility'
    if (score >= 60) return 'Good Match (Needs Minor Tweaks)'
    return 'Needs Critical Improvements'
  }

  const handleReset = () => {
    setFile(null)
    setAnalysis(null)
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page" 
      style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <Navbar />
      <ToastContainer />

      <main style={{ flex: 1, paddingTop: 100, paddingBottom: 64, position: 'relative', overflow: 'hidden' }}>
        {/* Decorative Background Orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <AnimatePresence mode="wait">
            {!analysis && !loading ? (
              /* --- Step 1: Upload --- */
              <motion.div
                key="upload-section"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--border-light)', border: '1px solid var(--border)', borderRadius: 100, padding: '4px 12px', fontSize: '0.8rem', color: 'var(--primary-light)', marginBottom: 20, fontWeight: 600 }}>
                  ⚡ Free Instant Evaluation Tool
                </div>
                <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: 16 }}>
                  ATS Resume <span className="gradient-text">Score Checker</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.7, fontSize: '1.05rem' }}>
                  Evaluate your resume's compatibility with Applicant Tracking Systems (ATS) used by recruiters worldwide. Check your skills, keyword density, and formatting inside a free, instant analysis.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    style={{
                      border: '2px dashed ' + (dragActive ? 'var(--primary)' : 'var(--border)'),
                      borderRadius: 'var(--radius-lg)',
                      background: dragActive ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                      padding: '48px 24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <input
                      type="file"
                      id="resume-upload"
                      accept=".pdf"
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="resume-upload" style={{ cursor: 'pointer', display: 'block' }}>
                      <div style={{ fontSize: '3rem', marginBottom: 16 }}>📄</div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: 8, color: 'var(--text)' }}>
                        {file ? file.name : 'Select or drag your PDF resume'}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · Click to replace` : 'Supports PDF format only (Max 5MB)'}
                      </p>
                    </label>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={!file}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    🚀 Analyze Resume Compatibility
                  </motion.button>
                </form>

                <div style={{ marginTop: 24, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  🔒 Resumes are analyzed in-memory and never stored on our servers.
                </div>
              </motion.div>
            ) : loading ? (
              /* --- Step 2: Loading State --- */
              <motion.div
                key="loading-section"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ maxWidth: 440, margin: '48px auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
              >
                <div className="spinner" style={{ width: 60, height: 60, borderWidth: 4 }} />
                
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Analyzing Resume</h3>
                
                <div style={{ width: '100%', background: 'var(--border-light)', height: 6, borderRadius: 100, overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: '0%' }}
                    animate={{ width: loadingStep === 0 ? '25%' : loadingStep === 1 ? '50%' : loadingStep === 2 ? '75%' : '100%' }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: 100 }}
                  />
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingStep}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}
                  >
                    {loadingStep === 0 && "📤 Uploading file and preparing engine..."}
                    {loadingStep === 1 && "📄 Parsing document structure and formatting..."}
                    {loadingStep === 2 && "🧠 Extracting technical skills and core matches..."}
                    {loadingStep === 3 && "⚙️ Comparing keyword densities against ATS templates..."}
                    {loadingStep === 4 && "✅ Compiling score report..."}
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            ) : (
              /* --- Step 3: Analysis Dashboard --- */
              <motion.div
                key="results-section"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
              >
                {/* Dashboard Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid var(--border-light)', paddingBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>ATS Compatibility Report</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>File evaluated: <strong style={{ color: 'var(--text)' }}>{file?.name}</strong></p>
                  </div>
                  <button onClick={handleReset} className="btn btn-secondary btn-sm" style={{ display: 'flex', gap: 6 }}>
                    🔄 Re-upload Resume
                  </button>
                </div>

                {/* Main Score Card Row */}
                <div className="card card-elevated" style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', background: 'linear-gradient(135deg, var(--bg-card), rgba(255,255,255,0.01))' }}>
                  {/* Radial Score Indicator */}
                  <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="140" height="140" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border-light)" strokeWidth="8" />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={getScoreColor(analysis.score)}
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        initial={{ strokeDashoffset: 251.2 }}
                        animate={{ strokeDashoffset: 251.2 - (251.2 * analysis.score) / 100 }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div style={{ position: 'absolute', fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: getScoreColor(analysis.score) }}>
                      {analysis.score}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, background: getScoreColor(analysis.score) + '22', color: getScoreColor(analysis.score), fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: 12 }}>
                      {analysis.score >= 80 ? '👑 Optimal' : analysis.score >= 60 ? '⚡ Average' : '⚠️ Low Match'}
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>{getScoreLabel(analysis.score)}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                      {analysis.score >= 80 
                        ? 'Great job! Your resume has stellar keyword density, clean structure, and highly relevant skill listings. It is optimized to clear automated applicant tracking filters and reach hiring managers.'
                        : analysis.score >= 60
                        ? 'Your resume is decently structured but is missing critical skills or suffers from minor formatting inconsistencies. Addressing the recommendations below will maximize your chances of getting an interview.'
                        : 'Your resume has low matching indicators. This could be due to complex layout elements, unrecognized headings, or a lack of relevant technical skills. Follow the detailed steps below to optimize.'
                      }
                    </p>
                  </div>
                </div>

                {/* Detailed Analysis Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                  
                  {/* Skills Alignment */}
                  <div className="card">
                    <h3 style={{ fontSize: '1.15rem', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                      🧠 Skills & Competency Alignment
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>Matched Skills ({analysis.skillsMatch.matched.length})</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {analysis.skillsMatch.matched.length === 0 ? (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>None found. Ensure your technical skills are listed as text.</span>
                          ) : (
                            analysis.skillsMatch.matched.map(s => (
                              <span key={s} className="badge badge-accent">{s}</span>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>Missing Field Skills ({analysis.skillsMatch.missing.length})</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {analysis.skillsMatch.missing.length === 0 ? (
                            <span style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>✓ No critical skills missing.</span>
                          ) : (
                            analysis.skillsMatch.missing.map(s => (
                              <span key={s} className="badge badge-warning" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>{s}</span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Formatting Analysis */}
                  <div className="card">
                    <h3 style={{ fontSize: '1.15rem', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>📄 Layout & Format Check</span>
                      <span style={{ fontSize: '1rem', color: getScoreColor(analysis.formatting.score), fontWeight: 700 }}>
                        {analysis.formatting.score}/100
                      </span>
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {analysis.formatting.details.map((detail, index) => {
                        const isWarning = detail.toLowerCase().includes('warning') || detail.toLowerCase().includes('missing');
                        return (
                          <div key={index} style={{ display: 'flex', gap: 10, fontSize: '0.88rem', alignItems: 'flex-start', color: isWarning ? 'var(--text-secondary)' : 'var(--text)' }}>
                            <span style={{ color: isWarning ? 'var(--danger)' : 'var(--accent)', fontWeight: 'bold' }}>
                              {isWarning ? '✕' : '✓'}
                            </span>
                            <span>{detail}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Keywords Optimization */}
                  <div className="card">
                    <h3 style={{ fontSize: '1.15rem', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                      🔑 Keyword Density & Optimization
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>Optimized Keywords</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {analysis.keywords.optimized.length === 0 ? (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>None matched. Include keywords that match job descriptions.</span>
                          ) : (
                            analysis.keywords.optimized.map(k => (
                              <span key={k} style={{ fontSize: '0.76rem', padding: '3px 8px', borderRadius: 4, background: 'var(--border-light)', color: 'var(--text)', border: '1px solid var(--border)' }}>{k}</span>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>Highly Suggested Keywords</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {analysis.keywords.suggestions.length === 0 ? (
                            <span style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>✓ Keywords fully optimized.</span>
                          ) : (
                            analysis.keywords.suggestions.map(k => (
                              <span key={k} style={{ fontSize: '0.76rem', padding: '3px 8px', borderRadius: 4, background: 'rgba(108,99,255,0.08)', color: 'var(--primary-light)', border: '1px solid rgba(108,99,255,0.15)', cursor: 'default' }}>{k}</span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Concrete Recommendations */}
                  <div className="card">
                    <h3 style={{ fontSize: '1.15rem', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                      🛠️ Recommended Action Checklist
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {analysis.recommendations.map((rec, index) => (
                        <div key={index} style={{ display: 'flex', gap: 10, fontSize: '0.88rem', alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>0{index + 1}.</span>
                          <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* --- LEAD GENERATION BANNER (CTA) --- */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, rgba(0,212,170,0.06) 100%)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '40px 32px',
                    textAlign: 'center',
                    marginTop: 24,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  <div style={{ position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'var(--primary)', opacity: 0.05, filter: 'blur(30px)' }} />
                  <div style={{ position: 'absolute', bottom: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'var(--accent)', opacity: 0.05, filter: 'blur(30px)' }} />

                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 16 }}>🧠✨</span>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 12, letterSpacing: '0.5px' }}>
                    Ditch Static PDFs. Build a <span className="gradient-text">Living Career Story</span>.
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 28px', lineHeight: 1.6, fontSize: '0.98rem' }}>
                    Instead of fighting ATS scanners, bypass them completely! Create a stunning interactive HireAI profile, practice mock interviews with real-time AI feedback, and share a high-impact direct link with recruiters.
                  </p>
                  
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/register" className="btn btn-primary btn-lg">
                      Build My AI Profile Free →
                    </Link>
                    <Link to="/login" className="btn btn-outline btn-lg">
                      Explore Candidate Portal
                    </Link>
                  </div>
                  <div style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Free forever for candidates · Sign up takes 30 seconds
                  </div>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-light)', padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div className="container">
          <span>© 2025 HireAI. All rights reserved.</span>
        </div>
      </footer>
    </motion.div>
  )
}
