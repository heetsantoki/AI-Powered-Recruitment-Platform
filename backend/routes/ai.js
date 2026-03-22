const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// ─── AI Engine (Rule-based NLP simulation) ─────────────────────────────────

const SKILL_KEYWORDS = {
  'React.js': ['react', 'jsx', 'hooks', 'redux', 'frontend'],
  'Node.js': ['node', 'nodejs', 'express', 'backend', 'server'],
  'Python': ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'ml', 'machine learning'],
  'TypeScript': ['typescript', 'ts', 'type'],
  'JavaScript': ['javascript', 'js', 'es6', 'es2015', 'vanilla'],
  'MongoDB': ['mongodb', 'mongo', 'nosql', 'mongoose'],
  'PostgreSQL': ['postgres', 'postgresql', 'relational', 'sql'],
  'Docker': ['docker', 'container', 'containeriz', 'devops'],
  'AWS': ['aws', 'amazon', 'cloud', 's3', 'ec2', 'lambda'],
  'GraphQL': ['graphql', 'apollo'],
  'Git': ['git', 'github', 'version control'],
  'REST APIs': ['api', 'rest', 'restful', 'endpoint', 'http'],
  'Vue.js': ['vue', 'vuex', 'nuxt'],
  'Angular': ['angular', 'typescript', 'rxjs'],
  'Java': ['java', 'spring', 'springboot', 'maven', 'gradle'],
  'Kubernetes': ['kubernetes', 'k8s', 'orchestrat'],
  'Redis': ['redis', 'cache', 'caching'],
  'TensorFlow': ['tensorflow', 'keras', 'deep learning', 'neural'],
  'Figma': ['figma', 'design', 'wireframe', 'prototype', 'ui', 'ux'],
  'CSS/SCSS': ['css', 'scss', 'sass', 'tailwind', 'styled-components'],
  'Next.js': ['nextjs', 'next.js', 'ssr', 'server-side rendering'],
  'Flutter': ['flutter', 'dart', 'mobile', 'ios', 'android'],
};

const ROLE_SKILL_MAP = {
  'frontend developer': ['React.js', 'JavaScript', 'TypeScript', 'CSS/SCSS', 'Next.js', 'Git', 'REST APIs'],
  'backend developer': ['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Docker', 'REST APIs', 'Redis', 'Git'],
  'full stack developer': ['React.js', 'Node.js', 'JavaScript', 'MongoDB', 'PostgreSQL', 'Git', 'REST APIs', 'Docker'],
  'data scientist': ['Python', 'TensorFlow', 'PostgreSQL', 'Git', 'REST APIs'],
  'devops engineer': ['Docker', 'Kubernetes', 'AWS', 'Git', 'Python'],
  'ui/ux designer': ['Figma', 'CSS/SCSS', 'JavaScript', 'React.js'],
  'mobile developer': ['Flutter', 'JavaScript', 'React.js', 'Git'],
};

// Parse free-form experience text → structured object
function parseExperienceText(text) {
  const lower = text.toLowerCase();

  // Extract job titles
  const titlePatterns = [
    /(?:worked as|working as|position of|role of|joined as|hired as)\s+([a-z\s]+?)(?:\s+at|\s+in|\s+@|,|\.)/i,
    /(?:i am|i was|i'm)\s+(?:a|an)\s+([a-z\s]+?)(?:\s+at|\s+in|\s+@|,|\.)/i,
    /([a-z\s]+?)\s+(?:at|@)\s+/i,
  ];
  let jobTitle = 'Software Engineer';
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match) {
      jobTitle = match[1].trim();
      // Clean up
      jobTitle = jobTitle.replace(/^(a|an|the)\s+/i, '');
      jobTitle = jobTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  // Extract company
  const companyPatterns = [
    /(?:at|@|for|in|with)\s+([A-Z][a-zA-Z\s]+?)(?:\s+for|\s+from|\s+since|,|\.|\n|$)/,
    /(?:company|organization|firm|startup)\s*(?:called|named)?\s+([A-Z][a-zA-Z\s]+?)(?:\s+for|,|\.|\n|$)/i,
  ];
  let company = 'Company';
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match) {
      company = match[1].trim();
      break;
    }
  }

  // Extract duration
  const durationPatterns = [
    /for\s+(\d+)\s*(year|month)/i,
    /(\d{4})\s*[-–to]+\s*(\d{4}|present|now|current)/i,
  ];
  let startDate = '';
  let endDate = null;
  let isCurrent = false;

  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern === durationPatterns[0]) {
        const years = parseInt(match[1]);
        const currentYear = new Date().getFullYear();
        if (match[2].toLowerCase().includes('year')) {
          startDate = `${currentYear - years}-01`;
        } else {
          const months = years;
          const d = new Date();
          d.setMonth(d.getMonth() - months);
          startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
        endDate = null;
        isCurrent = true;
      } else {
        startDate = `${match[1]}-01`;
        const end = match[2].toLowerCase();
        if (['present', 'now', 'current'].includes(end)) {
          isCurrent = true;
          endDate = null;
        } else {
          endDate = `${match[2]}-12`;
        }
      }
      break;
    }
  }

  // Extract achievements/bullets
  const bullets = [];
  const lines = text.split(/[.!?\n]+/).map(l => l.trim()).filter(l => l.length > 20);
  const achievementKeywords = ['built', 'developed', 'created', 'improved', 'reduced', 'increased', 'led', 'managed', 'designed', 'implemented', 'launched', 'optimized', 'automated', 'collaborated', 'mentored'];

  for (const line of lines) {
    const lline = line.toLowerCase();
    if (achievementKeywords.some(k => lline.includes(k))) {
      let bullet = line.trim();
      if (!bullet.match(/^[A-Z]/)) {
        bullet = bullet.charAt(0).toUpperCase() + bullet.slice(1);
      }
      bullets.push(bullet);
      if (bullets.length >= 4) break;
    }
  }

  // Generate description
  const description = `${jobTitle} at ${company}. ${text.slice(0, 120).trim()}${text.length > 120 ? '...' : ''}`;

  return {
    job_title: jobTitle,
    company,
    location: lower.includes('remote') ? 'Remote' : lower.includes('bangalore') ? 'Bangalore, India' : lower.includes('mumbai') ? 'Mumbai, India' : 'India',
    start_date: startDate,
    end_date: endDate,
    is_current: isCurrent,
    description,
    bullets: bullets.length > 0 ? bullets : [
      `Contributed to key features and deliverables at ${company}`,
      'Collaborated with cross-functional teams to meet project deadlines',
      'Applied best practices in software development and code quality',
    ]
  };
}

// Suggest skills from text/role
function suggestSkills(text, role = '') {
  const lower = (text + ' ' + role).toLowerCase();
  const suggestions = [];
  for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      suggestions.push(skill);
    }
  }
  // Also add role-based
  for (const [roleKey, skills] of Object.entries(ROLE_SKILL_MAP)) {
    if (lower.includes(roleKey)) {
      skills.forEach(s => { if (!suggestions.includes(s)) suggestions.push(s); });
    }
  }
  return [...new Set(suggestions)].slice(0, 12);
}

// Generate profile summary
function generateSummary(profile) {
  const { name, headline, location, experiences = [], skills = [], projects = [] } = profile;
  const skillNames = skills.slice(0, 5).map(s => s.name).join(', ');
  const expCount = experiences.length;
  const projCount = projects.length;
  const latestExp = experiences[0];

  let summary = `${name || 'I'} am a ${headline || 'technology professional'}`;
  if (location) summary += ` based in ${location}`;
  summary += '.';
  if (expCount > 0 && latestExp) {
    summary += ` Currently ${latestExp.is_current ? `working as ${latestExp.job_title} at ${latestExp.company}` : `experienced as ${latestExp.job_title}`}.`;
  }
  if (skillNames) {
    summary += ` Proficient in ${skillNames}.`;
  }
  if (projCount > 0) {
    summary += ` Have built ${projCount} notable project${projCount > 1 ? 's' : ''} showcasing hands-on expertise.`;
  }
  summary += ' Looking for opportunities to contribute to innovative teams and make a meaningful impact.';
  return summary;
}

// Recommend roles
function recommendRoles(skills = [], headline = '') {
  const skillNames = skills.map(s => s.name.toLowerCase());
  const headlineLower = headline.toLowerCase();
  const combined = skillNames.join(' ') + ' ' + headlineLower;

  const scores = {};
  for (const [role, roleSkills] of Object.entries(ROLE_SKILL_MAP)) {
    scores[role] = roleSkills.filter(s => combined.includes(s.toLowerCase())).length;
  }

  return Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([role]) => role.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
}

// ─── Routes ────────────────────────────────────────────────────────────────

// POST /api/ai/parse-experience
router.post('/parse-experience', auth, (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 10) {
    return res.status(400).json({ error: 'Provide at least 10 characters of experience text' });
  }
  // Simulate AI processing delay
  setTimeout(() => {
    const result = parseExperienceText(text);
    res.json({ success: true, experience: result });
  }, 800);
});

// POST /api/ai/suggest-skills
router.post('/suggest-skills', auth, (req, res) => {
  const { text = '', role = '' } = req.body;
  setTimeout(() => {
    const suggestions = suggestSkills(text, role);
    res.json({ success: true, suggestions });
  }, 500);
});

// POST /api/ai/generate-summary
router.post('/generate-summary', auth, (req, res) => {
  const { profile } = req.body;
  setTimeout(() => {
    const summary = generateSummary(profile);
    res.json({ success: true, summary });
  }, 700);
});

// POST /api/ai/recommend-roles
router.post('/recommend-roles', auth, (req, res) => {
  const { skills = [], headline = '' } = req.body;
  setTimeout(() => {
    const roles = recommendRoles(skills, headline);
    res.json({ success: true, roles });
  }, 400);
});

module.exports = router;
