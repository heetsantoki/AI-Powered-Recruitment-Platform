const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/ProfileBuilder.jsx', 'utf-8');

// Imports
content = content.replace(
    "import { ToastContainer } from '../components/Toast'",
    "import { ToastContainer } from '../components/Toast'\nimport { motion, AnimatePresence } from 'framer-motion'"
);

// Step wrappers
content = content.replace(
    /<div style={{ display: 'flex', flexDirection: 'column', gap: (\d+), animation: 'fadeIn 0.4s ease' }}>/g,
    "<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} style={{ display: 'flex', flexDirection: 'column', gap: $1 }}>"
);

// Close motion.divs
content = content.replace(
    /    <\/div>\n  \)\n}/g,
    "    </motion.div>\n  )\n}"
);

// AI Suggestion in BasicStep
content = content.replace(
    '{aiLoading && <div className="ai-response-card"><AITypingIndicator /></div>}',
    '{aiLoading && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: \'auto\' }} className="ai-response-card"><AITypingIndicator /></motion.div>}'
);
content = content.replace(
    '<div className="ai-response-card" style={{ marginBottom: 10 }}>',
    '<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ai-response-card" style={{ marginBottom: 10 }}>'
);
content = content.replace(
    '<button type="button" className="btn btn-accent btn-sm" style={{ marginTop: 12 }}',
    '<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" className="btn btn-accent btn-sm" style={{ marginTop: 12 }}'
);
content = content.replace(
    "Use This Summary ✓\n            </button>\n          </div>",
    "Use This Summary ✓\n            </motion.button>\n          </motion.div>"
);

// Experience cards
content = content.replace(
    "{data.map((exp, i) => (\n        <div key={i} className=\"card card-elevated\" style={{ position: 'relative' }}>",
    "<AnimatePresence>\n      {data.map((exp, i) => (\n        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} key={i} className=\"card card-elevated\" style={{ position: 'relative' }}>"
);
content = content.replace(
    "<span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{activeIdx === i ? '▲' : '▼'}</span>",
    "<motion.span animate={{ rotate: activeIdx === i ? 180 : 0 }} style={{ color: 'var(--text-muted)', fontSize: '1.2rem', display: 'inline-block' }}>▼</motion.span>"
);
content = content.replace(
    "{activeIdx === i && (\n            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>",
    "<AnimatePresence>\n          {activeIdx === i && (\n            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>\n              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8 }}>"
);

content = content.replace(
    "</textarea>\n              </div>\n            </div>\n          )}\n        </div>\n      ))}",
    "</textarea>\n              </div>\n              </div>\n            </motion.div>\n          )}\n          </AnimatePresence>\n        </motion.div>\n      )}\n      </AnimatePresence>"
);

// AI Parser in ExperienceStep
content = content.replace(
    "{aiLoading && (\n          <div className=\"ai-response-card\" style={{ marginTop: 16 }}>\n            <AITypingIndicator />\n            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>Structuring your experience...</p>\n          </div>\n        )}",
    "{aiLoading && (\n          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className=\"ai-response-card\" style={{ marginTop: 16 }}>\n            <AITypingIndicator />\n            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>Structuring your experience...</p>\n          </motion.div>\n        )}"
);

content = content.replace(
    "{aiParsed && !aiLoading && (\n          <div className=\"ai-response-card\" style={{ marginTop: 16 }}>",
    "{aiParsed && !aiLoading && (\n          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className=\"ai-response-card\" style={{ marginTop: 16 }}>"
);
content = content.replace(
    "Dismiss</button>\n            </div>\n          </div>\n        )}",
    "Dismiss</button>\n            </div>\n          </motion.div>\n        )}"
);

// Skill chips
content = content.replace(
    /<button key=\{s\} type="button" className="skill-chip" onClick=\{.*?>/g,
    (match) => match.replace('<button', '<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}')
);
content = content.replace(
    /\+ \{s\}\n                <\/button>/g,
    "+ {s}\n                </motion.button>"
);
content = content.replace(
    /<div key=\{i\} style=\{\{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var\(--bg-card\)', border: '1px solid var\(--border\)', borderRadius: 100, padding: '6px 12px 6px 14px' \}\}>/g,
    "<motion.div layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 12px 6px 14px' }}>"
);
content = content.replace(
    /✕<\/button>\n            <\/div>/g,
    "✕</button>\n            </motion.div>"
);

// Replace <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}> in Skills
content = content.replace(
    /<div style=\{\{ display: 'flex', flexWrap: 'wrap', gap: 8 \}\}>\n          \{data\.map\(\(skill, i\) =>/g,
    "<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>\n          <AnimatePresence>\n          {data.map((skill, i) =>"
);
content = content.replace(
    /<\/motion\.div>\n          \)\}\n          \{data\.length === 0/g,
    "</motion.div>\n          )}\n          </AnimatePresence>\n          {data.length === 0"
);

// Main Step rendering AnimatePresence
content = content.replace(
    "<div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 32, marginBottom: 32 }}>\n          {steps[step].component}\n        </div>",
    "<div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 32, marginBottom: 32, overflow: 'hidden' }}>\n          <AnimatePresence mode=\"wait\">\n            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>\n              {steps[step].component}\n            </motion.div>\n          </AnimatePresence>\n        </div>"
);

fs.writeFileSync('frontend/src/pages/ProfileBuilder.jsx', content, 'utf-8');
console.log('Animations applied.');
