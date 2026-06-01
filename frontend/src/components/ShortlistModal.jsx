import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

export default function ShortlistModal({ activeAlert, onClose }) {
  if (!activeAlert) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(10, 11, 30, 0.86)',
        backdropFilter: 'blur(20px)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}
      onClick={onClose}
    >
      {/* Centered Modal Card */}
      <motion.div
        initial={{ scale: 0.9, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="scroll-y"
        style={{
          width: '100%',
          maxWidth: 650,
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          background: '#13142B',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          padding: 32,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing on clicking inside card
      >
        {/* Close Button (×) */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '1.6rem',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'color 0.2s',
            lineHeight: 1
          }}
          onMouseEnter={(e) => e.target.style.color = '#fff'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
        >
          ×
        </button>

        {/* Row 1: Verified Shortlist Badge & Timestamp */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 14 }}>
          <span className="badge badge-accent" style={{
            textTransform: 'uppercase',
            fontSize: '0.7rem',
            padding: '4px 12px',
            fontWeight: 800,
            letterSpacing: '0.5px'
          }}>
            ✦ VERIFIED SHORTLIST
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            🕒 {activeAlert.created_at ? new Date(activeAlert.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) : 'Recently'}
          </span>
        </div>

        {/* Row 2: Standard Congratulations Notice Box */}
        <div style={{
          background: 'rgba(0, 212, 170, 0.04)',
          borderLeft: '4px solid var(--accent)',
          padding: '16px 20px',
          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
          fontSize: '0.88rem',
          color: 'var(--text)',
          lineHeight: 1.5
        }}>
          <span style={{ marginRight: 8, fontSize: '1rem' }}>📢</span>
          "Congratulations! Your profile has been shortlisted by a recruiter based on your skills and experience. The recruiter is interested in your profile and may contact you regarding potential opportunities."
        </div>

        {/* Row 3: Company Header Snap Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 20, alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 18 }}>
          {/* Logo wrapper */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 'var(--radius)',
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {activeAlert.company_logo ? (
              <img src={activeAlert.company_logo} alt={activeAlert.company_name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '2.2rem' }}>🏢</span>
            )}
          </div>

          {/* Company Name, Slogan & Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h4 style={{ fontSize: '1.25rem', color: '#fff', margin: 0, fontWeight: 700 }}>
              {activeAlert.company_name}
            </h4>
            {activeAlert.company_tagline && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                {activeAlert.company_tagline}
              </p>
            )}
            {activeAlert.company_description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '4px 0 0', lineHeight: 1.4 }}>
                {activeAlert.company_description}
              </p>
            )}
          </div>
        </div>

        {/* Row 4: Recruiter snapshot fields table */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px 24px',
          fontSize: '0.86rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              👔 RECRUITER NAME:
            </span>
            <span style={{ color: '#fff', fontWeight: 700 }}>
              {activeAlert.recruiter_name}
            </span>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              📧 RECRUITER EMAIL:
            </span>
            {activeAlert.official_email ? (
              <a href={`mailto:${activeAlert.official_email}`} style={{ color: 'var(--primary-light)', textDecoration: 'underline', fontWeight: 650 }}>
                {activeAlert.official_email}
              </a>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Not Available</span>
            )}
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              🌐 COMPANY WEBSITE:
            </span>
            {activeAlert.company_website ? (
              <a href={activeAlert.company_website.startsWith('http') ? activeAlert.company_website : `https://${activeAlert.company_website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 650 }}>
                {activeAlert.company_website}
              </a>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Not Available</span>
            )}
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              🔗 COMPANY LINKEDIN:
            </span>
            {activeAlert.linkedin_company_page ? (
              <a href={activeAlert.linkedin_company_page.startsWith('http') ? activeAlert.linkedin_company_page : `https://${activeAlert.linkedin_company_page}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 650 }}>
                {activeAlert.linkedin_company_page}
              </a>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Not Available</span>
            )}
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              👤 RECRUITER LINKEDIN:
            </span>
            {activeAlert.recruiter_linkedin ? (
              <a href={activeAlert.recruiter_linkedin.startsWith('http') ? activeAlert.recruiter_linkedin : `https://${activeAlert.recruiter_linkedin}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 650 }}>
                {activeAlert.recruiter_linkedin}
              </a>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Not Available</span>
            )}
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              💬 COMMUNICATION STATUS:
            </span>
            <span style={{ color: 'var(--warning)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>🔒</span> Informational Only (Replies Disabled)
            </span>
          </div>
        </div>

        {/* Bottom Action Close Panel */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '8px 18px', borderRadius: 'var(--radius-sm)' }}
          >
            Close Alert
          </button>
        </div>

      </motion.div>
    </motion.div>,
    document.body
  );
}
