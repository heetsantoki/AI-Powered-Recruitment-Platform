import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme, THEMES, RADII_PRESETS, FONTS_PRESETS } from '../context/ThemeContext'

export default function ThemeCustomizer() {
  const {
    theme,
    setTheme,
    radiusMode,
    setRadiusMode,
    fontMode,
    setFontMode,
    customColors,
    updateCustomColor,
    resetTheme
  } = useTheme()

  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDiy, setShowDiy] = useState(false)

  // Listen for Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCopyCSS = () => {
    const root = document.documentElement
    let colors = {}
    
    if (theme === 'custom') {
      // Get computed styles from the DOM since they are dynamically set on root
      const variables = [
        '--primary', '--primary-dark', '--primary-light', '--primary-glow',
        '--accent', '--accent-dark', '--warning', '--danger', '--success',
        '--bg', '--bg-secondary', '--bg-card', '--bg-card-hover', '--bg-input',
        '--text', '--text-secondary', '--text-muted', '--border', '--border-light'
      ]
      variables.forEach(v => {
        colors[v] = root.style.getPropertyValue(v).trim()
      })
    } else {
      colors = THEMES[theme]?.colors || THEMES.default.colors
    }

    const radii = RADII_PRESETS[radiusMode] || RADII_PRESETS.rounded
    const fonts = FONTS_PRESETS[fontMode] || FONTS_PRESETS.grotesk

    const cssText = `:root {
  /* Theme: ${theme === 'custom' ? 'Custom DIY Theme' : THEMES[theme]?.name} */
${Object.entries(colors).map(([k, v]) => `  ${k}: ${v};`).join('\n')}

  /* Layout Customizer */
${Object.entries(radii).map(([k, v]) => `  ${k}: ${v};`).join('\n')}
${Object.entries(fonts).map(([k, v]) => k.startsWith('--') ? `  ${k}: ${v};` : '').filter(Boolean).join('\n')}
}`

    navigator.clipboard.writeText(cssText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Pre-calculate preset representations for cards
  const presetsList = Object.entries(THEMES).map(([key, value]) => ({
    key,
    name: value.name,
    primary: value.colors['--primary'],
    accent: value.colors['--accent'],
    bg: value.colors['--bg'],
    text: value.colors['--text']
  }))

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="theme-trigger-btn"
        aria-label="Open Theme Studio"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: '1.5px solid var(--border)',
          background: 'rgba(15, 16, 40, 0.75)',
          backdropFilter: 'blur(16px)',
          boxShadow: 'var(--shadow-glow), 0 8px 32px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          outline: 'none',
        }}
        whileHover={{ 
          scale: 1.1, 
          borderColor: 'var(--primary)',
          boxShadow: '0 0 25px var(--primary-glow)'
        }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyItems: 'center' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="url(#fab-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            <defs>
              <linearGradient id="fab-gradient" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </motion.button>

      {/* Sliding Theme Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(5, 5, 12, 0.6)',
                backdropFilter: 'blur(8px)',
                zIndex: 1000,
              }}
            />

            {/* Sidebar Config Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                maxWidth: '400px',
                background: 'rgba(15, 16, 35, 0.95)',
                borderLeft: '1px solid var(--border)',
                backdropFilter: 'blur(24px)',
                boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)',
                zIndex: 1001,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '24px 20px',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-light)' }}>
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                    <path d="M12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8Z" fill="var(--primary)" />
                    <path d="M12 2V6" />
                    <path d="M12 18V22" />
                    <path d="M4.93 4.93L7.76 7.76" />
                    <path d="M16.24 16.24L19.07 19.07" />
                    <path d="M2 12H6" />
                    <path d="M18 12H22" />
                    <path d="M4.93 19.07L7.76 16.24" />
                    <path d="M16.24 7.76L19.07 4.93" />
                  </svg>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px', fontFamily: 'var(--font-display)' }}>Theme Studio</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid var(--border-light)',
                    color: 'var(--text-secondary)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.color = 'var(--text)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-light)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {/* Scrollable controls */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '28px',
              }} className="theme-customizer-scroll">
                
                {/* Section: Presets */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Visual Presets</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600 }}>6 Curated themes</span>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                  }}>
                    {presetsList.map((p) => {
                      const isActive = theme === p.key
                      return (
                        <motion.button
                          key={p.key}
                          onClick={() => setTheme(p.key)}
                          style={{
                            background: isActive ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                            border: '1.5px solid',
                            borderColor: isActive ? 'var(--primary)' : 'var(--border-light)',
                            borderRadius: '12px',
                            padding: '12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          whileHover={{ y: -2, borderColor: 'var(--primary-light)' }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Circle Geometric Previews */}
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: p.primary }} />
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: p.accent }} />
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: p.bg, border: '1px solid rgba(255,255,255,0.1)' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isActive ? 'var(--text)' : 'var(--text-secondary)' }}>{p.name}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.key === 'default' ? 'HireAI Signature' : 'Premium UI'}</span>
                          </div>

                          {isActive && (
                            <motion.div
                              layoutId="active-theme-check"
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: 'var(--primary)',
                                borderRadius: '50%',
                                width: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </motion.div>
                          )}
                        </motion.button>
                      )
                    })}

                    {/* DIY Custom Preset trigger */}
                    <motion.button
                      onClick={() => setTheme('custom')}
                      style={{
                        background: theme === 'custom' ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                        border: '1.5px solid',
                        borderColor: theme === 'custom' ? 'var(--primary)' : 'var(--border-light)',
                        borderRadius: '12px',
                        padding: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        position: 'relative',
                        overflow: 'hidden',
                        gridColumn: 'span 2'
                      }}
                      whileHover={{ y: -2, borderColor: 'var(--primary-light)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: customColors.primary }} />
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: customColors.accent }} />
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: customColors.bg, border: '1px solid rgba(255,255,255,0.1)' }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent)', fontWeight: 700 }}>Fully Interactive</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: theme === 'custom' ? 'var(--text)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          🎨 DIY Custom Theme Builder
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Choose your colors and watch them morph live</span>
                      </div>

                      {theme === 'custom' && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'var(--primary)',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Section: DIY custom color seeds panel (Shows when DIY Custom is active or toggled) */}
                <AnimatePresence>
                  {(theme === 'custom' || showDiy) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px dashed var(--border)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent)' }}>DIY Palette Seed Injector</h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'center' }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Primary</label>
                          <div style={{ position: 'relative', width: '100%', height: '36px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <input
                              type="color"
                              value={customColors.primary}
                              onChange={(e) => updateCustomColor('primary', e.target.value)}
                              style={{ position: 'absolute', inset: -5, width: '150%', height: '150%', cursor: 'pointer', border: 'none', background: 'none' }}
                            />
                          </div>
                          <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{customColors.primary}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'center' }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Accent</label>
                          <div style={{ position: 'relative', width: '100%', height: '36px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <input
                              type="color"
                              value={customColors.accent}
                              onChange={(e) => updateCustomColor('accent', e.target.value)}
                              style={{ position: 'absolute', inset: -5, width: '150%', height: '150%', cursor: 'pointer', border: 'none', background: 'none' }}
                            />
                          </div>
                          <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{customColors.accent}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'center' }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Canvas BG</label>
                          <div style={{ position: 'relative', width: '100%', height: '36px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <input
                              type="color"
                              value={customColors.bg}
                              onChange={(e) => updateCustomColor('bg', e.target.value)}
                              style={{ position: 'absolute', inset: -5, width: '150%', height: '150%', cursor: 'pointer', border: 'none', background: 'none' }}
                            />
                          </div>
                          <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{customColors.bg}</span>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: '1.4', textAlign: 'center' }}>
                        *Our dynamic layout logic will automatically generate cohesive cards, inputs, borders, and glows mathematically derived from these colors!
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Section: Border Radius */}
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Border Radius Aesthetics</h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    background: 'var(--bg-card)',
                    padding: '4px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                  }}>
                    {Object.keys(RADII_PRESETS).map((r) => {
                      const isActive = radiusMode === r
                      return (
                        <button
                          key={r}
                          onClick={() => setRadiusMode(r)}
                          style={{
                            background: isActive ? 'var(--primary)' : 'transparent',
                            border: 'none',
                            color: isActive ? '#fff' : 'var(--text-secondary)',
                            padding: '8px 0',
                            borderRadius: '7px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textTransform: 'capitalize',
                            transition: 'all 0.2s',
                          }}
                        >
                          {r}
                        </button>
                      )
                    })}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Sharp (0px)</span>
                    <span>Organic (18px+)</span>
                  </div>
                </div>

                {/* Section: Typography Presets */}
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Typography System</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(FONTS_PRESETS).map(([key, f]) => {
                      const isActive = fontMode === key
                      return (
                        <button
                          key={key}
                          onClick={() => setFontMode(key)}
                          style={{
                            background: isActive ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                            border: '1.5px solid',
                            borderColor: isActive ? 'var(--primary)' : 'var(--border-light)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isActive ? 'var(--text)' : 'var(--text-secondary)' }}>{f.name}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: f['--font'] }}>
                              Example text: The quick brown fox
                            </span>
                          </div>
                          
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isActive ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: isActive ? 'var(--primary-light)' : 'var(--text-muted)'
                          }}>
                            Aa
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Section: Copy CSS Stylesheet */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>CSS Export</h3>
                    <motion.button
                      onClick={handleCopyCSS}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', height: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {copied ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          <span style={{ color: 'var(--accent)' }}>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          <span>Copy CSS</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                  
                  <div style={{
                    background: '#04040A',
                    borderRadius: '8px',
                    padding: '12px',
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-light)',
                    lineHeight: '1.4'
                  }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`:root {
  /* Theme variables active */
  --primary: ${document.documentElement.style.getPropertyValue('--primary') || '#6C63FF'};
  --accent: ${document.documentElement.style.getPropertyValue('--accent') || '#00D4AA'};
  --bg: ${document.documentElement.style.getPropertyValue('--bg') || '#0A0B1A'};
  --radius: ${document.documentElement.style.getPropertyValue('--radius') || '12px'};
  --font: ${document.documentElement.style.getPropertyValue('--font') || "'Inter', sans-serif"};
}`}</pre>
                  </div>
                </div>

              </div>

              {/* Footer Panel Controls */}
              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border-light)',
                background: 'rgba(10, 11, 26, 0.5)',
                display: 'flex',
                gap: '12px',
              }}>
                <button
                  onClick={resetTheme}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    padding: '12px',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.color = 'var(--text)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  Reset Defaults
                </button>
                
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    border: 'none',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    boxShadow: 'var(--primary-glow) 0 4px 12px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Apply Studio
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
