import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { ToastContainer } from '../components/Toast'

const levelColor = { Beginner: '#FDCB6E', Intermediate: '#6C63FF', Advanced: '#00D4AA' }

// ─── SCALABLE TEMPLATE MAPPING ARCHITECTURE ───
const RESUME_TEMPLATES = {
  modern: {
    name: '✨ Modern Creative',
    desc: 'Elegant two-column design with slate sidebar',
    renderPDF: (doc, profile, u, p, W, H, M, helpers) => {
      const { checkPageBreak, addText } = helpers

      // Left Sidebar Block Fill
      doc.setFillColor(242, 243, 248)
      doc.rect(0, 0, 65, H, 'F')

      // Top dark banner block
      doc.setFillColor(15, 16, 40)
      doc.rect(0, 0, W, 48, 'F')

      // Name & Headline in Top Banner
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(255, 255, 255)
      doc.text(u.name || '', 20, 20)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(180, 175, 255)
      if (p.headline) doc.text(p.headline, 20, 30)

      doc.setFontSize(9)
      doc.setTextColor(200, 200, 220)
      let contactParts = []
      if (p.location) contactParts.push(`Location: ${p.location}`)
      if (p.phone) contactParts.push(`Phone: ${p.phone}`)
      if (u.email || p.email) contactParts.push(`Email: ${u.email || p.email}`)
      doc.text(contactParts.join('   •   '), 20, 39)

      // We will separate y for Left Sidebar and Right Column
      let yLeft = 60
      const addLeftSection = (title) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(108, 99, 255)
        doc.text(title.toUpperCase(), 10, yLeft)
        doc.setDrawColor(108, 99, 255)
        doc.setLineWidth(0.3)
        doc.line(10, yLeft + 2, 55, yLeft + 2)
        yLeft += 8
      }

      const addLeftText = (text, small = true, color = [80, 80, 100], fontType = 'normal') => {
        doc.setFont('helvetica', fontType)
        doc.setFontSize(small ? 8 : 9)
        doc.setTextColor(...color)
        const lines = doc.splitTextToSize(text, 45) // width of sidebar area is 45
        lines.forEach(l => {
          doc.text(l, 10, yLeft)
          yLeft += 4.5
        })
      }

      // Sidebar: Social links
      let hasSocials = p.linkedin || p.github || p.portfolio
      if (hasSocials) {
        addLeftSection('Links')
        if (p.linkedin) { addLeftText(`LinkedIn: ${p.linkedin.replace('linkedin.com/in/', '')}`); yLeft += 1.5 }
        if (p.github) { addLeftText(`GitHub: ${p.github.replace('github.com/', '')}`); yLeft += 1.5 }
        if (p.portfolio) { addLeftText(`Portfolio: ${p.portfolio}`); yLeft += 1.5 }
        yLeft += 3
      }

      // Sidebar: Skills
      if (profile.skills?.length) {
        addLeftSection('Skills')
        const catGroup = {}
        profile.skills.forEach(s => {
          if (!catGroup[s.category]) catGroup[s.category] = []
          catGroup[s.category].push(s.name)
        })
        Object.entries(catGroup).forEach(([cat, names]) => {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8)
          doc.setTextColor(60, 60, 80)
          doc.text(cat.toUpperCase(), 10, yLeft)
          yLeft += 4
          addLeftText(names.join(', '))
          yLeft += 2
        })
        yLeft += 2
      }

      // Sidebar: Education
      if (profile.education?.length) {
        addLeftSection('Education')
        profile.education.forEach(e => {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8)
          doc.setTextColor(50, 50, 70)
          const degLines = doc.splitTextToSize(`${e.degree} in ${e.field_of_study}`, 45)
          degLines.forEach(l => { doc.text(l, 10, yLeft); yLeft += 4 })
          addLeftText(e.institution, true, [100, 100, 120])
          addLeftText(`${e.start_year} – ${e.end_year}`, true, [130, 130, 150], 'italic')
          yLeft += 3
        })
      }

      // Right Column content y:
      let y = 60
      const addRightSection = (title) => {
        y = checkPageBreak(y, 12)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(108, 99, 255)
        doc.text(title.toUpperCase(), 75, y)
        doc.setDrawColor(108, 99, 255)
        doc.setLineWidth(0.4)
        doc.line(75, y + 2, 195, y + 2)
        y += 8
      }

      // About
      if (p.summary) {
        addRightSection('About Me')
        y = addText(p.summary, 75, false, [70, 70, 90], 'normal', y)
        y += 4
      }

      // Experience
      if (profile.experiences?.length) {
        addRightSection('Experience')
        profile.experiences.forEach(e => {
          y = checkPageBreak(y, 16)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(30, 30, 50)
          doc.text(e.job_title, 75, y)
          
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(9)
          doc.setTextColor(100, 100, 120)
          const dateStr = `${e.start_date} – ${e.is_current ? 'Present' : e.end_date || ''}`
          doc.text(dateStr, 195, y, { align: 'right' })
          y += 5.5

          y = addText(`${e.company}  ·  ${e.location || ''}`, 75, true, [108, 99, 255], 'bold', y)
          y += 1
          
          if (e.description) {
            y = addText(e.description, 75, true, [80, 80, 100], 'normal', y)
          }
          if (e.bullets?.length) {
            e.bullets.slice(0, 3).forEach(b => {
              y = addText(`• ${b}`, 77, true, [80, 80, 100], 'normal', y)
            })
          }
          y += 3
        })
      }

      // Projects
      if (profile.projects?.length) {
        addRightSection('Projects')
        profile.projects.slice(0, 3).forEach(proj => {
          y = checkPageBreak(y, 14)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(30, 30, 50)
          doc.text(proj.title, 75, y)
          y += 5

          if (proj.description) {
            y = addText(proj.description, 75, true, [80, 80, 100], 'normal', y)
          }
          if (proj.tech_stack?.length) {
            y = addText(`Tech Stack: ${proj.tech_stack.join(', ')}`, 75, true, [108, 99, 255], 'bold', y)
          }
          y += 3
        })
      }
    },
    renderHTML: (profile, u, p, initials, levelColor, skillsByCategory) => {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          {/* Top banner */}
          <div style={{ padding: '24px 30px', background: '#0F1028', borderBottom: '1px solid var(--border)' }}>
            <h1 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: 4 }}>{u.name}</h1>
            <p style={{ color: 'var(--primary-light)', fontWeight: 600, fontSize: '1.05rem', marginBottom: 8 }}>{p.headline}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
              {p.location && <span>📍 {p.location}</span>}
              {p.phone && <span>📱 {p.phone}</span>}
              {u.email && <span>📧 {u.email}</span>}
              {p.availability && <span className="badge badge-accent" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>{p.availability}</span>}
            </div>
          </div>

          {/* Two Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '30% 70%', minHeight: 400 }}>
            {/* Sidebar */}
            <div style={{ background: 'rgba(255,255,255,0.015)', borderRight: '1px solid var(--border)', padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Links */}
              {(p.linkedin || p.github || p.portfolio) && (
                <div>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>Links</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {p.linkedin && <a href={`https://${p.linkedin}`} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>🔗 LinkedIn</a>}
                    {p.github && <a href={`https://${p.github}`} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>💻 GitHub</a>}
                    {p.portfolio && <a href={`https://${p.portfolio}`} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>🌐 Portfolio</a>}
                  </div>
                </div>
              )}

              {/* Skills */}
              {profile.skills?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>Skills</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                      <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{cat}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {catSkills.map((s, idx) => (
                            <span key={idx} className="badge badge-muted" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{s.name}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {profile.education?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>Education</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {profile.education.map((edu, idx) => (
                      <div key={idx} style={{ fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>{edu.degree}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{edu.field_of_study}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{edu.institution}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontStyle: 'italic' }}>{edu.start_year} – {edu.end_year}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main content */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* About */}
              {p.summary && (
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>About Me</h3>
                  <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.6 }}>{p.summary}</p>
                </div>
              )}

              {/* Experience */}
              {profile.experiences?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>Experience</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {profile.experiences.map((exp, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                          <strong style={{ fontSize: '0.95rem' }}>{exp.job_title}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{exp.start_date} – {exp.is_current ? 'Present' : exp.end_date}</span>
                        </div>
                        <div style={{ color: 'var(--primary-light)', fontSize: '0.85rem', fontWeight: 600 }}>{exp.company} <span style={{ color: 'var(--text-muted)' }}>· {exp.location || 'Remote'}</span></div>
                        {exp.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>{exp.description}</p>}
                        {exp.bullets?.length > 0 && (
                          <ul style={{ paddingLeft: 16, color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4, lineHeight: 1.6 }}>
                            {exp.bullets.map((b, bidx) => <li key={bidx}>{b}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {profile.projects?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>Projects</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {profile.projects.slice(0, 3).map((proj, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <strong style={{ fontSize: '0.95rem' }}>{proj.title}</strong>
                        {proj.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{proj.description}</p>}
                        {proj.tech_stack?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                            {proj.tech_stack.map((t, tidx) => (
                              <span key={tidx} className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }
  },
  executive: {
    name: '💼 Corporate Executive',
    desc: 'Classic centered, navy structured corporate layout',
    renderPDF: (doc, profile, u, p, W, H, M, helpers) => {
      const { checkPageBreak, addText } = helpers

      // Center aligned name & title block
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(24)
      doc.setTextColor(15, 42, 74) // Deep navy
      doc.text(u.name || '', W / 2, 22, { align: 'center' })

      doc.setFont('helvetica', 'italic')
      doc.setFontSize(11)
      doc.setTextColor(100, 110, 120)
      if (p.headline) doc.text(p.headline, W / 2, 29, { align: 'center' })

      // Contact details
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 90)

      let execContacts1 = []
      if (p.location) execContacts1.push(`Location: ${p.location}`)
      if (p.phone) execContacts1.push(`Phone: ${p.phone}`)
      if (u.email || p.email) execContacts1.push(`Email: ${u.email || p.email}`)

      let execContacts2 = []
      if (p.linkedin) execContacts2.push(`LinkedIn: ${p.linkedin.replace('https://', '').replace('www.', '').replace('linkedin.com/in/', '')}`)
      if (p.github) execContacts2.push(`GitHub: ${p.github.replace('https://', '').replace('www.', '').replace('github.com/', '')}`)
      if (p.portfolio) execContacts2.push(`Portfolio: ${p.portfolio.replace('https://', '').replace('www.', '')}`)

      doc.text(execContacts1.join('   •   '), W / 2, 34, { align: 'center' })
      let y = 50
      if (execContacts2.length) {
        doc.text(execContacts2.join('   •   '), W / 2, 39, { align: 'center' })
        // Thin elegant horizontal gold line below the second row
        doc.setDrawColor(212, 175, 55)
        doc.setLineWidth(0.7)
        doc.line(M, 43, W - M, 43)
        y = 52
      } else {
        // Thin elegant horizontal gold line below the first row
        doc.setDrawColor(212, 175, 55)
        doc.setLineWidth(0.7)
        doc.line(M, 38, W - M, 38)
        y = 47
      }

      const addExecSection = (title) => {
        y = checkPageBreak(y, 12)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(15, 42, 74) // Navy
        doc.text(title.toUpperCase(), M, y)
        doc.setDrawColor(15, 42, 74)
        doc.setLineWidth(0.4)
        doc.line(M, y + 2, W - M, y + 2)
        y += 8
      }

      // About
      if (p.summary) {
        addExecSection('Professional Summary')
        y = addText(p.summary, M, false, [50, 50, 60], 'normal', y)
        y += 4
      }

      // Experience
      if (profile.experiences?.length) {
        addExecSection('Professional Experience')
        profile.experiences.forEach(e => {
          y = checkPageBreak(y, 16)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10.5)
          doc.setTextColor(30, 30, 40)
          doc.text(e.job_title, M, y)

          // Right aligned dates
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9.5)
          doc.setTextColor(80, 80, 90)
          const dateStr = `${e.start_date} – ${e.is_current ? 'Present' : e.end_date || ''}`
          doc.text(dateStr, W - M, y, { align: 'right' })
          y += 5.5

          // Company
          y = addText(`${e.company}   |   Location: ${e.location || 'Remote'}`, M + 2, true, [15, 42, 74], 'bold', y)
          y += 1

          if (e.description) {
            y = addText(e.description, M + 2, true, [60, 60, 70], 'normal', y)
          }
          if (e.bullets?.length) {
            e.bullets.slice(0, 4).forEach(b => {
              y = addText(`•  ${b}`, M + 4, true, [60, 60, 70], 'normal', y)
            })
          }
          y += 3
        })
      }

      // Projects
      if (profile.projects?.length) {
        addExecSection('Key Achievements & Projects')
        profile.projects.slice(0, 3).forEach(proj => {
          y = checkPageBreak(y, 14)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10.5)
          doc.setTextColor(30, 30, 40)
          doc.text(proj.title, M, y)
          y += 5

          if (proj.description) {
            y = addText(proj.description, M + 2, true, [60, 60, 70], 'normal', y)
          }
          if (proj.tech_stack?.length) {
            y = addText(`Technologies Utilized: ${proj.tech_stack.join(', ')}`, M + 2, true, [15, 42, 74], 'bold', y)
          }
          y += 3
        })
      }

      // Skills
      if (profile.skills?.length) {
        addExecSection('Areas of Expertise')
        const catGroup = {}
        profile.skills.forEach(s => {
          if (!catGroup[s.category]) catGroup[s.category] = []
          catGroup[s.category].push(s.name)
        })
        Object.entries(catGroup).forEach(([cat, names]) => {
          y = checkPageBreak(y, 8)
          y = addText(`${cat}:  ${names.join(', ')}`, M, true, [60, 60, 70], 'bold', y)
        })
        y += 4
      }

      // Education
      if (profile.education?.length) {
        addExecSection('Education & Credentials')
        profile.education.forEach(e => {
          y = checkPageBreak(y, 12)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10.5)
          doc.setTextColor(30, 30, 40)
          doc.text(`${e.degree} in ${e.field_of_study}`, M, y)

          // Right aligned dates
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9.5)
          doc.setTextColor(80, 80, 90)
          doc.text(`${e.start_year} – ${e.end_year}`, W - M, y, { align: 'right' })
          y += 5.5

          y = addText(`${e.institution}   ·   Grade: ${e.grade || 'N/A'}`, M + 2, true, [60, 60, 70], 'italic', y)
          y += 3
        })
      }
    },
    renderHTML: (profile, u, p, initials, levelColor, skillsByCategory) => {
      const line1 = []
      if (p.location) line1.push(`Location: ${p.location}`)
      if (p.phone) line1.push(`Phone: ${p.phone}`)
      if (u.email || p.email) line1.push(`Email: ${u.email || p.email}`)

      const line2 = []
      if (p.linkedin) line2.push(`LinkedIn: ${p.linkedin.replace('https://', '').replace('www.', '').replace('linkedin.com/in/', '')}`)
      if (p.github) line2.push(`GitHub: ${p.github.replace('https://', '').replace('www.', '').replace('github.com/', '')}`)
      if (p.portfolio) line2.push(`Portfolio: ${p.portfolio.replace('https://', '').replace('www.', '')}`)

      return (
        <div style={{ padding: '40px 32px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center' }}>
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h1 style={{ fontSize: '2rem', color: 'var(--primary-light)', marginBottom: 2 }}>{u.name}</h1>
            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '1rem' }}>{p.headline}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
              {line1.length > 0 && <div>{line1.join('   •   ')}</div>}
              {line2.length > 0 && <div>{line2.join('   •   ')}</div>}
            </div>
          </div>

          {/* Thin Gold Separator */}
          <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />

          {/* Details (Centered align logic for sections but content is clean list) */}
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* About */}
            {p.summary && (
              <div>
                <h3 style={{ fontSize: '0.92rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 8 }}>Professional Summary</h3>
                <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.6 }}>{p.summary}</p>
              </div>
            )}

            {/* Experience */}
            {profile.experiences?.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.92rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 12 }}>Professional Experience</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {profile.experiences.map((exp, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                        <strong style={{ fontSize: '0.98rem' }}>{exp.job_title}</strong>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exp.start_date} – {exp.is_current ? 'Present' : exp.end_date}</strong>
                      </div>
                      <div style={{ color: 'var(--primary-light)', fontSize: '0.85rem', fontWeight: 700 }}>{exp.company} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>| {exp.location || 'Remote'}</span></div>
                      {exp.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>{exp.description}</p>}
                      {exp.bullets?.length > 0 && (
                        <ul style={{ paddingLeft: 16, color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4, lineHeight: 1.6 }}>
                          {exp.bullets.map((b, bidx) => <li key={bidx}>• {b}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {profile.projects?.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.92rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 12 }}>Key Achievements & Projects</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {profile.projects.slice(0, 3).map((proj, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <strong style={{ fontSize: '0.98rem' }}>{proj.title}</strong>
                      {proj.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{proj.description}</p>}
                      {proj.tech_stack?.length > 0 && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary-light)', marginTop: 2 }}>
                          <strong>Technologies Utilized:</strong> {proj.tech_stack.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.92rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 12 }}>Areas of Expertise</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                    <div key={cat} style={{ fontSize: '0.85rem' }}>
                      <strong style={{ color: 'var(--text-secondary)' }}>{cat}:</strong>{' '}
                      <span style={{ color: 'var(--text)' }}>{catSkills.map(s => s.name).join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education?.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.92rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 12 }}>Education & Credentials</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {profile.education.map((edu, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{edu.degree} in {edu.field_of_study}</strong>
                        <p style={{ color: 'var(--primary-light)', fontSize: '0.82rem', marginTop: 2 }}>{edu.institution}</p>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <strong>{edu.start_year} – {edu.end_year}</strong>
                        {edu.grade && <div style={{ fontSize: '0.78rem', marginTop: 2, color: 'var(--accent)', fontWeight: 700 }}>CGPA/Grade: {edu.grade}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }
  },
  minimalist: {
    name: '💻 Tech Minimalist',
    desc: 'Clean, modern sans-serif engineering layout with slate accents',
    renderPDF: (doc, profile, u, p, W, H, M, helpers) => {
      const { checkPageBreak, addText } = helpers

      // Name & Headline
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(30, 30, 40)
      doc.text(u.name || '', M, 22)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(16, 185, 129) // Tech Emerald green
      if (p.headline) doc.text(p.headline.toUpperCase(), M, 29)

      // Minimalist contact & Social Links
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      
      let line1 = []
      if (p.location) line1.push(`Location: ${p.location}`)
      if (p.phone) line1.push(`Phone: ${p.phone}`)
      if (u.email || p.email) line1.push(`Email: ${u.email || p.email}`)

      let line2 = []
      if (p.linkedin) line2.push(`LinkedIn: ${p.linkedin.replace('https://', '').replace('www.', '').replace('linkedin.com/in/', '')}`)
      if (p.github) line2.push(`GitHub: ${p.github.replace('https://', '').replace('www.', '').replace('github.com/', '')}`)
      if (p.portfolio) line2.push(`Portfolio: ${p.portfolio.replace('https://', '').replace('www.', '')}`)

      doc.text(line1.join('   •   '), M, 34)
      let y = 48
      if (line2.length) {
        doc.text(line2.join('   •   '), M, 39)
        // Thin separator under second line
        doc.setDrawColor(220, 220, 225)
        doc.setLineWidth(0.3)
        doc.line(M, 43, W - M, 43)
        y = 51
      } else {
        // Thin separator under first line
        doc.setDrawColor(220, 220, 225)
        doc.setLineWidth(0.3)
        doc.line(M, 38, W - M, 38)
        y = 46
      }

      const addMiniSection = (title) => {
        y = checkPageBreak(y, 14)
        doc.setFillColor(16, 185, 129) // Left vertical bar
        doc.rect(M, y - 4, 1.5, 5, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(30, 30, 40)
        doc.text(title.toUpperCase(), M + 4, y)
        y += 8
      }

      // About
      if (p.summary) {
        addMiniSection('Technical Summary')
        y = addText(p.summary, M, false, [70, 70, 80], 'normal', y)
        y += 4
      }

      // Experience
      if (profile.experiences?.length) {
        addMiniSection('Technical Experience')
        profile.experiences.forEach(e => {
          y = checkPageBreak(y, 16)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10.5)
          doc.setTextColor(30, 30, 40)
          doc.text(e.job_title, M, y)

          // Right aligned dates
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(9.5)
          doc.setTextColor(120, 120, 120)
          const dateStr = `${e.start_date} – ${e.is_current ? 'Present' : e.end_date || ''}`
          doc.text(dateStr, W - M, y, { align: 'right' })
          y += 5.5

          // Company
          y = addText(`${e.company}  ·  ${e.location || 'Remote'}`, M + 2, true, [16, 185, 129], 'bold', y)
          y += 1

          if (e.description) {
            y = addText(e.description, M + 2, true, [80, 80, 90], 'normal', y)
          }
          if (e.bullets?.length) {
            e.bullets.slice(0, 3).forEach(b => {
              y = addText(`• ${b}`, M + 4, true, [80, 80, 90], 'normal', y)
            })
          }
          y += 3
        })
      }

      // Projects
      if (profile.projects?.length) {
        addMiniSection('Key Projects')
        profile.projects.slice(0, 3).forEach(proj => {
          y = checkPageBreak(y, 14)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10.5)
          doc.setTextColor(30, 30, 40)
          doc.text(proj.title, M, y)
          y += 5

          if (proj.description) {
            y = addText(proj.description, M + 2, true, [80, 80, 90], 'normal', y)
          }
          if (proj.tech_stack?.length) {
            y = addText(`Technologies: ${proj.tech_stack.join(', ')}`, M + 2, true, [16, 185, 129], 'bold', y)
          }
          y += 3
        })
      }

      // Skills
      if (profile.skills?.length) {
        addMiniSection('Skills & Technologies')
        const catGroup = {}
        profile.skills.forEach(s => {
          if (!catGroup[s.category]) catGroup[s.category] = []
          catGroup[s.category].push(s.name)
        })
        Object.entries(catGroup).forEach(([cat, names]) => {
          y = checkPageBreak(y, 8)
          y = addText(`${cat}:  ${names.join(', ')}`, M, true, [80, 80, 90], 'bold', y)
        })
        y += 4
      }

      // Education
      if (profile.education?.length) {
        addMiniSection('Education')
        profile.education.forEach(e => {
          y = checkPageBreak(y, 12)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10.5)
          doc.setTextColor(30, 30, 40)
          doc.text(`${e.degree} in ${e.field_of_study}`, M, y)

          // Right aligned dates
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9.5)
          doc.setTextColor(120, 120, 120)
          doc.text(`${e.start_year} – ${e.end_year}`, W - M, y, { align: 'right' })
          y += 5.5

          y = addText(`${e.institution}  ·  Grade: ${e.grade || 'N/A'}`, M + 2, true, [80, 80, 90], 'italic', y)
          y += 3
        })
      }
    },
    renderHTML: (profile, u, p, initials, levelColor, skillsByCategory) => {
      const line1 = []
      if (p.location) line1.push(`Location: ${p.location}`)
      if (p.phone) line1.push(`Phone: ${p.phone}`)
      if (u.email || p.email) line1.push(`Email: ${u.email || p.email}`)

      const line2 = []
      if (p.linkedin) line2.push(`LinkedIn: ${p.linkedin.replace('https://', '').replace('www.', '').replace('linkedin.com/in/', '')}`)
      if (p.github) line2.push(`GitHub: ${p.github.replace('https://', '').replace('www.', '').replace('github.com/', '')}`)
      if (p.portfolio) line2.push(`Portfolio: ${p.portfolio.replace('https://', '').replace('www.', '')}`)

      return (
        <div style={{ padding: '36px 30px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'left' }}>
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h1 style={{ fontSize: '1.9rem', color: 'var(--text)', fontWeight: 800 }}>{u.name}</h1>
            <p style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px' }}>{p.headline ? p.headline.toUpperCase() : ''}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 4 }}>
              {line1.length > 0 && <div>{line1.join('   •   ')}</div>}
              {line2.length > 0 && <div>{line2.join('   •   ')}</div>}
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* Sections */}
          {/* About */}
          {p.summary && (
            <div>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 800, textTransform: 'uppercase', borderLeft: '3px solid #10B981', paddingLeft: 10, marginBottom: 8 }}>Technical Summary</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.6 }}>{p.summary}</p>
            </div>
          )}

          {/* Experience */}
          {profile.experiences?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 800, textTransform: 'uppercase', borderLeft: '3px solid #10B981', paddingLeft: 10, marginBottom: 12 }}>Technical Experience</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {profile.experiences.map((exp, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{exp.job_title}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{exp.start_date} – {exp.is_current ? 'Present' : exp.end_date}</span>
                    </div>
                    <div style={{ color: '#10B981', fontSize: '0.82rem', fontWeight: 700 }}>{exp.company} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {exp.location || 'Remote'}</span></div>
                    {exp.description && <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 4 }}>{exp.description}</p>}
                    {exp.bullets?.length > 0 && (
                      <ul style={{ paddingLeft: 16, color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: 4, lineHeight: 1.6 }}>
                        {exp.bullets.map((b, bidx) => <li key={bidx}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {profile.projects?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 800, textTransform: 'uppercase', borderLeft: '3px solid #10B981', paddingLeft: 10, marginBottom: 12 }}>Key Projects</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {profile.projects.slice(0, 3).map((proj, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{proj.title}</strong>
                    {proj.description && <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{proj.description}</p>}
                    {proj.tech_stack?.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: 2, fontWeight: 700 }}>
                        Technologies: {proj.tech_stack.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 800, textTransform: 'uppercase', borderLeft: '3px solid #10B981', paddingLeft: 10, marginBottom: 12 }}>Skills & Technologies</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                  <div key={cat} style={{ fontSize: '0.84rem' }}>
                    <strong>{cat}:</strong>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{catSkills.map(s => s.name).join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {profile.education?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 800, textTransform: 'uppercase', borderLeft: '3px solid #10B981', paddingLeft: 10, marginBottom: 12 }}>Education</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {profile.education.map((edu, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text)' }}>{edu.degree} in {edu.field_of_study}</strong>
                      <p style={{ color: '#10B981', fontSize: '0.8rem', marginTop: 2, fontWeight: 600 }}>{edu.institution}</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      <strong>{edu.start_year} – {edu.end_year}</strong>
                      {edu.grade && <div style={{ fontSize: '0.78rem', marginTop: 2, color: 'var(--text-muted)' }}>Grade: {edu.grade}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }
  }
}

export default function ProfilePreview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [linkCopied, setLinkCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  // Improvement 1: Persist Template Selection in localStorage
  const [pdfTemplate, setPdfTemplate] = useState(() => {
    return localStorage.getItem('hireai-pdf-template') || 'modern'
  })

  // Keep localStorage synced with template updates
  useEffect(() => {
    localStorage.setItem('hireai-pdf-template', pdfTemplate)
  }, [pdfTemplate])

  useEffect(() => {
    api.get('/profile').then(res => { setProfile(res.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const downloadPDF = () => {
    if (!profile) return
    setGenerating(true)
    const { user: u, profile: p } = profile
    const doc = new jsPDF('p', 'mm', 'a4')
    const W = 210, H = 297, M = 20
    let y = 20

    // Common Page Break Helper
    const checkPageBreak = (currentY, heightNeeded) => {
      if (currentY + heightNeeded > 275) {
        doc.addPage()
        y = 20
        // Re-draw background fills on new page for modern creative layout
        if (pdfTemplate === 'modern') {
          doc.setFillColor(242, 243, 248)
          doc.rect(0, 0, 65, H, 'F')
        }
        return 20
      }
      return currentY
    }

    const addText = (text, indent = M, small = false, color = [70, 70, 90], fontType = 'normal', startY = y) => {
      doc.setFont('helvetica', fontType)
      doc.setFontSize(small ? 9 : 10)
      doc.setTextColor(...color)
      const lines = doc.splitTextToSize(text, W - indent - M)
      let currentY = startY
      lines.forEach(l => {
        currentY = checkPageBreak(currentY, 5.5)
        doc.text(l, indent, currentY)
        currentY += 5.5
      })
      return currentY
    }

    const addMinimalistText = (text, indent = M, small = false, color = [70, 70, 90], fontType = 'normal', startY = y) => {
      doc.setFont('courier', fontType)
      doc.setFontSize(small ? 9 : 10)
      doc.setTextColor(...color)
      const lines = doc.splitTextToSize(text, W - indent - M)
      let currentY = startY
      lines.forEach(l => {
        currentY = checkPageBreak(currentY, 5.5)
        doc.text(l, indent, currentY)
        currentY += 5.5
      })
      return currentY
    }

    // ─── SCALABLE TEMPLATE ARCHITECTURE INVOCATION ───
    const selectedTemplate = RESUME_TEMPLATES[pdfTemplate] || RESUME_TEMPLATES.modern
    selectedTemplate.renderPDF(doc, profile, u, p, W, H, M, { checkPageBreak, addText, addMinimalistText })

    // Common Footer
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 200)
    doc.text('Generated by HireAI — Smart Recruitment Platform', M, 285)

    doc.save(`${(u.name || 'profile').replace(/ /g, '_')}_HireAI.pdf`)
    setGenerating(false)
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!profile) return null

  const { user: u, profile: p, skills } = profile
  const initials = (u?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const skillsByCategory = {}
  skills.forEach(s => { if (!skillsByCategory[s.category]) skillsByCategory[s.category] = []; skillsByCategory[s.category].push(s) })

  // Active Layout Rendering Selection
  const activeTemplate = RESUME_TEMPLATES[pdfTemplate] || RESUME_TEMPLATES.modern

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <ToastContainer />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '90px 24px 60px' }}>
        {/* Action Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link to="/profile/builder" className="btn btn-secondary btn-sm">✏️ Edit Profile</Link>
          <button className="btn btn-secondary btn-sm" onClick={copyLink}>{linkCopied ? '✓ Copied!' : '🔗 Share Link'}</button>
          <button className="btn btn-primary btn-sm" onClick={downloadPDF} disabled={generating}>
            {generating ? <><span className="spinner spinner-sm" />Generating...</> : '⬇ Download PDF'}
          </button>
        </div>

        {/* Template Selector Card */}
        <div className="card" style={{ marginBottom: 24, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Select Resume PDF Design</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {Object.entries(RESUME_TEMPLATES).map(([key, t]) => {
              const active = pdfTemplate === key
              return (
                <button
                  key={key}
                  onClick={() => setPdfTemplate(key)}
                  className={`btn ${active ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 6,
                    padding: '16px 20px',
                    whiteSpace: 'normal',
                    textAlign: 'left',
                    borderRadius: 'var(--radius)',
                    borderColor: active ? 'var(--primary)' : 'var(--border-light)',
                    height: 'auto'
                  }}
                >
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: active ? '#fff' : 'var(--text)' }}>{t.name}</span>
                  <span style={{ fontSize: '0.74rem', opacity: 0.8, color: active ? '#eee' : 'var(--text-secondary)', fontWeight: 400, lineHeight: 1.4 }}>{t.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Completion Indicator */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Profile Completion</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{p.completion_percent || 0}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${p.completion_percent || 0}%` }} />
          </div>
          {p.is_submitted ? (
            <div style={{ marginTop: 10, color: 'var(--accent)', fontSize: '0.85rem' }}>✓ Profile submitted — visible to recruiters</div>
          ) : (
            <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Complete your profile and submit to become visible to recruiters</div>
          )}
        </div>

        {/* ─── DYNAMIC 1:1 CONSISTENT RESUME PREVIEW AREA ─── */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: -12,
            right: 16,
            background: 'var(--accent)',
            color: '#0A0B1A',
            fontSize: '0.7rem',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '100px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            zIndex: 2
          }}>
            Live Design Preview
          </div>
          {activeTemplate.renderHTML(profile, u, p, initials, levelColor, skillsByCategory)}
        </div>

      </div>
    </div>
  )
}
