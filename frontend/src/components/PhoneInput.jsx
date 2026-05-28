import { useState, useEffect, useRef } from 'react'

export const COUNTRIES = [
  { name: 'India', code: '+91', flag: '🇮🇳', length: 10, pattern: /^\d{10}$/, placeholder: '98765 43210' },
  { name: 'United States', code: '+1', flag: '🇺🇸', length: 10, pattern: /^\d{10}$/, placeholder: '555-0199' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧', length: 10, pattern: /^\d{10}$/, placeholder: '7123 456789' },
  { name: 'Germany', code: '+49', flag: '🇩🇪', length: 11, pattern: /^\d{11}$/, placeholder: '151 23456789' },
  { name: 'Australia', code: '+61', flag: '🇦🇺', length: 9, pattern: /^\d{9}$/, placeholder: '412 345 678' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪', length: 9, pattern: /^\d{9}$/, placeholder: '50 123 4567' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬', length: 8, pattern: /^\d{8}$/, placeholder: '8123 4567' },
];

export const validatePhone = (val) => {
  if (!val) return false;
  const found = COUNTRIES.find(c => val.startsWith(c.code));
  if (found) {
    const localNumber = val.slice(found.code.length);
    return found.pattern.test(localNumber);
  }
  return val.trim().length >= 8;
};

export default function PhoneInput({ value, onChange, placeholder, style = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Parse current value
  const getSelectedCountry = () => {
    if (!value) return COUNTRIES[0];
    const found = COUNTRIES.find(c => value.startsWith(c.code));
    return found || COUNTRIES[0];
  };

  const getLocalNumber = (country) => {
    if (!value) return '';
    if (value.startsWith(country.code)) {
      return value.slice(country.code.length);
    }
    return value;
  };

  const country = getSelectedCountry();
  const localNumber = getLocalNumber(country);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (c) => {
    // Retain digits and clamp to new country length
    const sanitized = localNumber.replace(/\D/g, '').slice(0, c.length);
    onChange(c.code + sanitized);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    // Only allow digits
    const sanitized = e.target.value.replace(/\D/g, '').slice(0, country.length);
    onChange(country.code + sanitized);
  };

  const isValid = country.pattern.test(localNumber);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', ...style }}>
      <div style={{ display: 'flex', gap: 8, position: 'relative', width: '100%' }}>
        {/* Country Selector Button */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-input)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              padding: '12px 16px',
              fontSize: '0.95rem',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s',
              height: 48,
              minWidth: 92,
              justifyContent: 'center',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          >
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{country.flag}</span>
            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{country.code}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>▼</span>
          </button>

          {/* Glassmorphic Dropdown List */}
          {isOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 1000,
              background: 'rgba(19, 20, 43, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              minWidth: 260,
              maxHeight: 280,
              overflowY: 'auto',
              padding: 4,
              animation: 'fadeIn 0.2s ease',
            }}>
              {COUNTRIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleCountrySelect(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 14px',
                    background: c.name === country.name ? 'rgba(108, 99, 255, 0.15)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: c.name === country.name ? 'var(--text)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = 'var(--text)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = c.name === country.name ? 'rgba(108, 99, 255, 0.15)' : 'transparent';
                    e.currentTarget.style.color = c.name === country.name ? 'var(--text)' : 'var(--text-secondary)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.25rem' }}>{c.flag}</span>
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                  </div>
                  <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{c.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Local Number Input */}
        <input
          type="text"
          value={localNumber}
          onChange={handleInputChange}
          placeholder={placeholder || country.placeholder}
          style={{
            flex: 1,
            background: 'var(--bg-input)',
            border: '1.5px solid var(--border)',
            borderColor: localNumber && !isValid ? 'var(--danger)' : 'var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            padding: '12px 16px',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'all 0.2s',
            height: 48,
          }}
          onFocus={(e) => {
            if (localNumber && !isValid) {
              e.target.style.boxShadow = '0 0 0 3px rgba(225,112,85,0.15)';
            } else {
              e.target.style.borderColor = 'var(--primary)';
              e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = localNumber && !isValid ? 'var(--danger)' : 'var(--border)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Validation Message */}
      {localNumber && !isValid && (
        <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 2, paddingLeft: 4 }}>
          Please enter a valid {country.length}-digit local number for {country.name}.
        </span>
      )}
    </div>
  );
}
