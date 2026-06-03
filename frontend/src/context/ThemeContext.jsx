import React, { createContext, useContext, useState, useEffect } from 'react'

export const THEMES = {
  default: {
    name: 'Midnight Aether',
    colors: {
      '--primary': '#6C63FF',
      '--primary-dark': '#5A54D4',
      '--primary-light': '#8B85FF',
      '--primary-glow': 'rgba(108, 99, 255, 0.3)',
      '--accent': '#00D4AA',
      '--accent-dark': '#00B894',
      '--warning': '#FDCB6E',
      '--danger': '#E17055',
      '--success': '#00D4AA',
      '--bg': '#0A0B1A',
      '--bg-secondary': '#0F1028',
      '--bg-card': '#13142B',
      '--bg-card-hover': '#1A1B35',
      '--bg-input': '#1A1B35',
      '--text': '#F0F1FF',
      '--text-secondary': '#9799C4',
      '--text-muted': '#5A5C80',
      '--border': 'rgba(108, 99, 255, 0.15)',
      '--border-light': 'rgba(255, 255, 255, 0.06)',
    },
    lightColors: {
      '--primary': '#6C63FF',
      '--primary-dark': '#5A54D4',
      '--primary-light': '#8B85FF',
      '--primary-glow': 'rgba(108, 99, 255, 0.15)',
      '--accent': '#00B894',
      '--accent-dark': '#008F72',
      '--warning': '#F1C40F',
      '--danger': '#E74C3C',
      '--success': '#00B894',
      '--bg': '#F8F9FD',
      '--bg-secondary': '#FFFFFF',
      '--bg-card': '#FFFFFF',
      '--bg-card-hover': '#F0F2FA',
      '--bg-input': '#F0F2FA',
      '--text': '#0A0B1A',
      '--text-secondary': '#5C5E7F',
      '--text-muted': '#9799B5',
      '--border': 'rgba(108, 99, 255, 0.15)',
      '--border-light': 'rgba(108, 99, 255, 0.08)',
    }
  },
  cyberpunk: {
    name: 'Cyberpunk 2077',
    colors: {
      '--primary': '#FF007F',
      '--primary-dark': '#D00060',
      '--primary-light': '#FF5EAD',
      '--primary-glow': 'rgba(255, 0, 127, 0.3)',
      '--accent': '#00F0FF',
      '--accent-dark': '#00B8C4',
      '--warning': '#FEEB3B',
      '--danger': '#FF3B30',
      '--success': '#00F0FF',
      '--bg': '#05050C',
      '--bg-secondary': '#0C0C18',
      '--bg-card': '#121226',
      '--bg-card-hover': '#1C1C3A',
      '--bg-input': '#121226',
      '--text': '#F0FFFF',
      '--text-secondary': '#A0A5CF',
      '--text-muted': '#596096',
      '--border': 'rgba(0, 240, 255, 0.25)',
      '--border-light': 'rgba(255, 0, 127, 0.12)',
    },
    lightColors: {
      '--primary': '#FF007F',
      '--primary-dark': '#D00060',
      '--primary-light': '#FF5EAD',
      '--primary-glow': 'rgba(255, 0, 127, 0.15)',
      '--accent': '#00B8C4',
      '--accent-dark': '#008C99',
      '--warning': '#FBC531',
      '--danger': '#E84118',
      '--success': '#00B8C4',
      '--bg': '#FCF6F9',
      '--bg-secondary': '#FFFFFF',
      '--bg-card': '#FFFFFF',
      '--bg-card-hover': '#FFEAF5',
      '--bg-input': '#FFEAF5',
      '--text': '#12000C',
      '--text-secondary': '#7A5B6D',
      '--text-muted': '#B38DA4',
      '--border': 'rgba(255, 0, 127, 0.18)',
      '--border-light': 'rgba(0, 240, 255, 0.12)',
    }
  },
  emerald: {
    name: 'Deep Emerald',
    colors: {
      '--primary': '#10B981',
      '--primary-dark': '#059669',
      '--primary-light': '#34D399',
      '--primary-glow': 'rgba(16, 185, 129, 0.3)',
      '--accent': '#F59E0B',
      '--accent-dark': '#D97706',
      '--warning': '#EAB308',
      '--danger': '#EF4444',
      '--success': '#10B981',
      '--bg': '#040D0A',
      '--bg-secondary': '#0A1B14',
      '--bg-card': '#102A20',
      '--bg-card-hover': '#183D2E',
      '--bg-input': '#102A20',
      '--text': '#E6F4EA',
      '--text-secondary': '#9ECBB2',
      '--text-muted': '#56876E',
      '--border': 'rgba(16, 185, 129, 0.2)',
      '--border-light': 'rgba(245, 158, 11, 0.1)',
    },
    lightColors: {
      '--primary': '#10B981',
      '--primary-dark': '#059669',
      '--primary-light': '#34D399',
      '--primary-glow': 'rgba(16, 185, 129, 0.15)',
      '--accent': '#D97706',
      '--accent-dark': '#B45309',
      '--warning': '#F59E0B',
      '--danger': '#EF4444',
      '--success': '#10B981',
      '--bg': '#F4FAF7',
      '--bg-secondary': '#FFFFFF',
      '--bg-card': '#FFFFFF',
      '--bg-card-hover': '#E3F5EC',
      '--bg-input': '#E3F5EC',
      '--text': '#03170E',
      '--text-secondary': '#476C59',
      '--text-muted': '#7CA891',
      '--border': 'rgba(16, 185, 129, 0.18)',
      '--border-light': 'rgba(16, 185, 129, 0.08)',
    }
  },
  sunset: {
    name: 'Sunset Glow',
    colors: {
      '--primary': '#FF5E62',
      '--primary-dark': '#E03E42',
      '--primary-light': '#FF8E91',
      '--primary-glow': 'rgba(255, 94, 98, 0.3)',
      '--accent': '#FF9F43',
      '--accent-dark': '#EE7E18',
      '--warning': '#F1C40F',
      '--danger': '#E74C3C',
      '--success': '#2ECC71',
      '--bg': '#0F0A14',
      '--bg-secondary': '#181021',
      '--bg-card': '#241833',
      '--bg-card-hover': '#332247',
      '--bg-input': '#241833',
      '--text': '#FFF2F5',
      '--text-secondary': '#CCA6CD',
      '--text-muted': '#805982',
      '--border': 'rgba(255, 94, 98, 0.2)',
      '--border-light': 'rgba(255, 159, 67, 0.1)',
    },
    lightColors: {
      '--primary': '#FF5E62',
      '--primary-dark': '#E03E42',
      '--primary-light': '#FF8E91',
      '--primary-glow': 'rgba(255, 94, 98, 0.15)',
      '--accent': '#EE7E18',
      '--accent-dark': '#C7630C',
      '--warning': '#F1C40F',
      '--danger': '#E74C3C',
      '--success': '#2ECC71',
      '--bg': '#FFF9FA',
      '--bg-secondary': '#FFFFFF',
      '--bg-card': '#FFFFFF',
      '--bg-card-hover': '#FFEAEB',
      '--bg-input': '#FFEAEB',
      '--text': '#1F050A',
      '--text-secondary': '#7D555A',
      '--text-muted': '#B08B8F',
      '--border': 'rgba(255, 94, 98, 0.18)',
      '--border-light': 'rgba(255, 94, 98, 0.08)',
    }
  },
  'midnight-gold': {
    name: 'Obsidian Royalty',
    colors: {
      '--primary': '#D4AF37',
      '--primary-dark': '#B89327',
      '--primary-light': '#F3E5AB',
      '--primary-glow': 'rgba(212, 175, 55, 0.3)',
      '--accent': '#FAFAFC',
      '--accent-dark': '#D1D1D6',
      '--warning': '#E5A93C',
      '--danger': '#CF4B3C',
      '--success': '#2FB07B',
      '--bg': '#09090A',
      '--bg-secondary': '#0F0F12',
      '--bg-card': '#16161A',
      '--bg-card-hover': '#222228',
      '--bg-input': '#16161A',
      '--text': '#FAFAFC',
      '--text-secondary': '#B5B5BE',
      '--text-muted': '#696976',
      '--border': 'rgba(212, 175, 55, 0.25)',
      '--border-light': 'rgba(250, 250, 252, 0.08)',
    },
    lightColors: {
      '--primary': '#B89327',
      '--primary-dark': '#9A781E',
      '--primary-light': '#D4AF37',
      '--primary-glow': 'rgba(184, 147, 39, 0.15)',
      '--accent': '#3A3A3C',
      '--accent-dark': '#1C1C1E',
      '--warning': '#E5A93C',
      '--danger': '#CF4B3C',
      '--success': '#2FB07B',
      '--bg': '#FAF9F5',
      '--bg-secondary': '#FFFFFF',
      '--bg-card': '#FFFFFF',
      '--bg-card-hover': '#F3EFE0',
      '--bg-input': '#F3EFE0',
      '--text': '#1A1810',
      '--text-secondary': '#6B634B',
      '--text-muted': '#9E957B',
      '--border': 'rgba(212, 175, 55, 0.25)',
      '--border-light': 'rgba(212, 175, 55, 0.1)',
    }
  },
  'lavender': {
    name: 'Stellar Lavender',
    colors: {
      '--primary': '#8B5CF6',
      '--primary-dark': '#7C3AED',
      '--primary-light': '#A78BFA',
      '--primary-glow': 'rgba(139, 92, 246, 0.3)',
      '--accent': '#EC4899',
      '--accent-dark': '#DB2777',
      '--warning': '#FBBF24',
      '--danger': '#EF4444',
      '--success': '#10B981',
      '--bg': '#080714',
      '--bg-secondary': '#0F0D24',
      '--bg-card': '#181538',
      '--bg-card-hover': '#221E4F',
      '--bg-input': '#181538',
      '--text': '#F5F3FF',
      '--text-secondary': '#C5C0E6',
      '--text-muted': '#7570A3',
      '--border': 'rgba(139, 92, 246, 0.2)',
      '--border-light': 'rgba(236, 72, 153, 0.1)',
    },
    lightColors: {
      '--primary': '#8B5CF6',
      '--primary-dark': '#7C3AED',
      '--primary-light': '#A78BFA',
      '--primary-glow': 'rgba(139, 92, 246, 0.15)',
      '--accent': '#DB2777',
      '--accent-dark': '#BE185D',
      '--warning': '#FBBF24',
      '--danger': '#EF4444',
      '--success': '#10B981',
      '--bg': '#F9F8FC',
      '--bg-secondary': '#FFFFFF',
      '--bg-card': '#FFFFFF',
      '--bg-card-hover': '#F0EDF9',
      '--bg-input': '#F0EDF9',
      '--text': '#0F0C24',
      '--text-secondary': '#686290',
      '--text-muted': '#9D97C5',
      '--border': 'rgba(139, 92, 246, 0.18)',
      '--border-light': 'rgba(139, 92, 246, 0.08)',
    }
  }
}

export const RADII_PRESETS = {
  sharp: {
    '--radius-sm': '0px',
    '--radius': '0px',
    '--radius-lg': '0px',
    '--radius-xl': '0px',
  },
  minimal: {
    '--radius-sm': '4px',
    '--radius': '6px',
    '--radius-lg': '8px',
    '--radius-xl': '12px',
  },
  rounded: {
    '--radius-sm': '8px',
    '--radius': '12px',
    '--radius-lg': '20px',
    '--radius-xl': '28px',
  },
  organic: {
    '--radius-sm': '12px',
    '--radius': '18px',
    '--radius-lg': '30px',
    '--radius-xl': '40px',
  }
}

export const FONTS_PRESETS = {
  grotesk: {
    name: 'Aether Display',
    '--font': "'Inter', sans-serif",
    '--font-display': "'Space Grotesk', sans-serif"
  },
  mono: {
    name: 'Hack Monospace',
    '--font': "'Source Code Pro', monospace",
    '--font-display': "'JetBrains Mono', monospace"
  },
  outfit: {
    name: 'Outfit Elegance',
    '--font': "'DM Sans', sans-serif",
    '--font-display': "'Outfit', sans-serif"
  }
}

// Dynamic theme seed helpers
function hexToRgba(hex, alpha) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustColor(hex, percent) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  let r = parseInt(c.substring(0, 2), 16) || 0;
  let g = parseInt(c.substring(2, 4), 16) || 0;
  let b = parseInt(c.substring(4, 6), 16) || 0;

  r = Math.min(255, Math.max(0, r + percent));
  g = Math.min(255, Math.max(0, g + percent));
  b = Math.min(255, Math.max(0, b + percent));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('hireai-theme') || 'default')
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('hireai-theme-mode') || 'dark')
  const [radiusMode, setRadiusMode] = useState(() => localStorage.getItem('hireai-radius') || 'rounded')
  const [fontMode, setFontMode] = useState(() => localStorage.getItem('hireai-font') || 'grotesk')
  const [customColors, setCustomColors] = useState(() => {
    try {
      const saved = localStorage.getItem('hireai-custom-colors')
      return saved ? JSON.parse(saved) : { primary: '#6C63FF', accent: '#00D4AA', bg: '#0A0B1A' }
    } catch {
      return { primary: '#6C63FF', accent: '#00D4AA', bg: '#0A0B1A' }
    }
  })

  // Dynamic stylesheet logic to inject premium google fonts dynamically
  useEffect(() => {
    const fontLinks = {
      mono: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Source+Code+Pro:wght@300;400;500;600;700&display=swap',
      outfit: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;700&display=swap'
    }

    if (fontLinks[fontMode]) {
      const linkId = `google-font-${fontMode}`
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        link.href = fontLinks[fontMode]
        document.head.appendChild(link)
      }
    }
  }, [fontMode])

  // Apply variables to root document html node
  useEffect(() => {
    const root = document.documentElement
    let colors = {}

    if (theme === 'custom') {
      const p = customColors.primary
      const a = customColors.accent
      const b = customColors.bg
      
      if (themeMode === 'light') {
        colors = {
          '--primary': p,
          '--primary-dark': adjustColor(p, -20),
          '--primary-light': adjustColor(p, 20),
          '--primary-glow': hexToRgba(p, 0.15),
          '--accent': a,
          '--accent-dark': adjustColor(a, -20),
          '--warning': '#F1C40F',
          '--danger': '#E74C3C',
          '--success': a,
          '--bg': '#F8F9FD',
          '--bg-secondary': '#FFFFFF',
          '--bg-card': '#FFFFFF',
          '--bg-card-hover': '#F0F2F9',
          '--bg-input': '#F0F2F9',
          '--text': '#0F1020',
          '--text-secondary': '#5A5C7A',
          '--text-muted': '#9092B0',
          '--border': hexToRgba(p, 0.15),
          '--border-light': hexToRgba(p, 0.08),
        }
      } else {
        colors = {
          '--primary': p,
          '--primary-dark': adjustColor(p, -30),
          '--primary-light': adjustColor(p, 40),
          '--primary-glow': hexToRgba(p, 0.3),
          '--accent': a,
          '--accent-dark': adjustColor(a, -30),
          '--warning': '#FDCB6E',
          '--danger': '#E17055',
          '--success': a,
          '--bg': b,
          '--bg-secondary': adjustColor(b, 8),
          '--bg-card': adjustColor(b, 15),
          '--bg-card-hover': adjustColor(b, 25),
          '--bg-input': adjustColor(b, 15),
          '--text': '#F5F5FC',
          '--text-secondary': adjustColor(b, 175),
          '--text-muted': adjustColor(b, 100),
          '--border': hexToRgba(p, 0.18),
          '--border-light': hexToRgba(a, 0.08),
        }
      }
    } else {
      const activeTheme = THEMES[theme] || THEMES.default
      colors = themeMode === 'light' ? (activeTheme.lightColors || activeTheme.colors) : activeTheme.colors
    }

    // Apply color custom properties
    Object.entries(colors).forEach(([variable, value]) => {
      root.style.setProperty(variable, value)
    })

    // Apply shadow custom properties dynamically for premium light mode support
    const shadows = themeMode === 'light' ? {
      '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
      '--shadow': '0 8px 32px rgba(108, 99, 255, 0.08)',
      '--shadow-lg': '0 20px 60px rgba(108, 99, 255, 0.12)',
      '--shadow-glow': '0 0 40px rgba(108, 99, 255, 0.1)',
    } : {
      '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.3)',
      '--shadow': '0 8px 32px rgba(0, 0, 0, 0.4)',
      '--shadow-lg': '0 20px 60px rgba(0, 0, 0, 0.5)',
      '--shadow-glow': '0 0 40px rgba(108, 99, 255, 0.2)',
    }
    Object.entries(shadows).forEach(([variable, value]) => {
      root.style.setProperty(variable, value)
    })

    // Apply radius custom properties
    const radii = RADII_PRESETS[radiusMode] || RADII_PRESETS.rounded
    Object.entries(radii).forEach(([variable, value]) => {
      root.style.setProperty(variable, value)
    })

    // Apply font custom properties
    const fonts = FONTS_PRESETS[fontMode] || FONTS_PRESETS.grotesk
    Object.entries(fonts).forEach(([variable, value]) => {
      if (variable.startsWith('--')) {
        root.style.setProperty(variable, value)
      }
    })

    // Persist to local storage
    localStorage.setItem('hireai-theme', theme)
    localStorage.setItem('hireai-theme-mode', themeMode)
    localStorage.setItem('hireai-radius', radiusMode)
    localStorage.setItem('hireai-font', fontMode)
    localStorage.setItem('hireai-custom-colors', JSON.stringify(customColors))

  }, [theme, themeMode, radiusMode, fontMode, customColors])

  const setTheme = (name) => {
    if (THEMES[name] || name === 'custom') {
      setThemeState(name)
    }
  }

  const toggleThemeMode = () => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const updateCustomColor = (key, hex) => {
    setCustomColors(prev => ({
      ...prev,
      [key]: hex
    }))
    setThemeState('custom')
  }

  const resetTheme = () => {
    setThemeState('default')
    setThemeMode('dark')
    setRadiusMode('rounded')
    setFontMode('grotesk')
    setCustomColors({ primary: '#6C63FF', accent: '#00D4AA', bg: '#0A0B1A' })
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      themeMode,
      setThemeMode,
      toggleThemeMode,
      radiusMode,
      setRadiusMode,
      fontMode,
      setFontMode,
      customColors,
      updateCustomColor,
      resetTheme
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
