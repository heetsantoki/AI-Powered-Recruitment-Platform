const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✦ Gemini AI Engine initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini AI client:', err);
  }
}

// Helper: Dynamically request content with retries and fallback models on 503/429 spikes
async function generateGeminiContentWithFallback(prompt, generationConfig = null) {
  const models = [
    'gemini-3.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash'
  ];
  let lastError = null;
  const maxRetries = 2; // Number of retries per model

  for (const modelName of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 Attempting Gemini content generation via ${modelName} (Attempt ${attempt + 1}/${maxRetries + 1})...`);
        const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
        const response = await model.generateContent(prompt);
        const text = response.response.text().trim();
        console.log(`✅ Content generation succeeded using model: ${modelName} on attempt ${attempt + 1}`);
        return text;
      } catch (err) {
        lastError = err;
        const isTransient = err.status === 503 || err.message?.includes('503') || err.message?.includes('high demand') || err.message?.includes('ResourceExhausted');
        const isQuotaExceeded = err.status === 429 || err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('Quota');

        if (isTransient && !isQuotaExceeded && attempt < maxRetries) {
          console.warn(`⚠️ Model "${modelName}" busy (503/high demand). Waiting 2 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue; // Try the next attempt for the same model
        }
        
        console.warn(`⚠️ Model "${modelName}" failed permanently or exhausted all retries. Error:`, err.message || err);
        break; // Break the attempt loop to move to the next fallback model in the list
      }
    }
  }

  throw lastError || new Error('All Gemini fallback models and retries failed.');
}

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
router.post('/parse-experience', auth, async (req, res) => {
  const { text, engine } = req.body;
  if (!text || text.trim().length < 10) {
    return res.status(400).json({ error: 'Provide at least 10 characters of experience text' });
  }

  if (engine === 'gemini' && genAI) {
    try {
      const prompt = `
You are an expert resume parsing AI. Parse the following free-form experience description into a structured JSON object.

Text: "${text}"

The JSON object MUST have the following structure:
{
  "job_title": "String (e.g. Senior Software Engineer)",
  "company": "String (e.g. Google)",
  "location": "String (e.g. Remote, Bangalore, India)",
  "start_date": "String in YYYY-MM format or empty",
  "end_date": "String in YYYY-MM format or null",
  "is_current": Boolean,
  "description": "String (a brief summary sentence describing the role)",
  "bullets": ["Array of 2-4 high-impact bullet points focusing on quantitative achievements and actions starting with strong action verbs. Do not use markdown syntax in the bullets."]
}
`;
      const responseText = await generateGeminiContentWithFallback(prompt, { responseMimeType: 'application/json' });
      const parsedData = JSON.parse(responseText);
      return res.json({ success: true, experience: parsedData, is_gemini: true });
    } catch (err) {
      console.error('Gemini parse-experience error, falling back to local engine:', err);
      const result = parseExperienceText(text);
      return res.json({ success: true, experience: result, is_gemini: false, fallback: true });
    }
  }

  // Local AI engine
  setTimeout(() => {
    const result = parseExperienceText(text);
    res.json({ success: true, experience: result, is_gemini: false });
  }, 800);
});

// POST /api/ai/suggest-skills
router.post('/suggest-skills', auth, async (req, res) => {
  const { text = '', role = '' } = req.body;

  if (!role || role.trim().length === 0) {
    return res.status(400).json({ error: 'Please enter a target role to get suggestions.' });
  }

  if (genAI) {
    try {
      const prompt = `
You are an expert technical interviewer. Based on the target role: "${role}" and current candidate context (existing skills): "${text}", suggest a comprehensive list of the 24 most relevant technical skills, tools, frameworks, and specialized concepts.
Provide a highly diverse, granular list matching the target role, covering libraries, build tools, design principles, testing suites, databases, and architectural concepts. 
For example:
- If Frontend Developer: suggest HTML, CSS, JavaScript, React, Tailwind CSS, Redux, TypeScript, Next.js, Responsive Design, Webpack, Jest, SASS, Git, REST APIs, Context API, CSS Grid, HTML5 Semantic Tags, Web Performance Optimization, etc.
- If Backend Developer: suggest Node.js, Express.js, MongoDB, PostgreSQL, REST API, Docker, JWT, Authentication, MySQL, Redis, GraphQL, MVC Architecture, Microservices, Jest (Testing), AWS S3, CI/CD pipelines, System Design, etc.

Return a JSON object with this exact structure:
{
  "suggestions": ["Skill 1", "Skill 2", "Skill 3", ...]
}
`;
      const responseText = await generateGeminiContentWithFallback(prompt, { responseMimeType: 'application/json' });
      const parsedData = JSON.parse(responseText);
      return res.json({ success: true, suggestions: parsedData.suggestions, is_gemini: true });
    } catch (err) {
      console.error('Gemini suggest-skills error:', err);
      return res.status(500).json({ error: 'Gemini AI failed to generate skill suggestions. Check API connection.' });
    }
  }

  return res.status(403).json({ error: 'Gemini AI is not configured. Please add GEMINI_API_KEY to your .env file.' });
});

// POST /api/ai/generate-summary
router.post('/generate-summary', auth, async (req, res) => {
  const { profile } = req.body;
  const { name, headline, location, summaryInput, headlineInput } = profile || {};

  if (genAI) {
    try {
      let prompt = '';
      if (summaryInput && summaryInput.trim().length > 0) {
        prompt = `
You are an expert resume writer. Based on the raw, draft professional summary written by the candidate: "${summaryInput}", write a polished, professional, and compelling profile summary (3-4 sentences). 
Improve the grammar, vocabulary, and sentence structure, while retaining the core skills and experiences mentioned.
Candidate Name: ${name || 'the candidate'}
Location: ${location || ''}
Professional Headline: ${headline || ''}
Keep the output highly professional. Do not use placeholders or markdown.
`;
      } else {
        prompt = `
You are an expert resume writer. Based on the candidate's professional headline: "${headlineInput || headline}", write a highly professional, compelling, and engaging profile summary (3-4 sentences) that highlights their expertise, target role, and potential impact.
Candidate Name: ${name || 'the candidate'}
Location: ${location || ''}
Keep the output highly professional. Do not use placeholders or markdown.
`;
      }
      
      const summaryText = await generateGeminiContentWithFallback(prompt);
      return res.json({ success: true, summary: summaryText, is_gemini: true });
    } catch (err) {
      console.error('Gemini generate-summary error, falling back to local engine:', err);
      const summary = generateSummary(profile);
      return res.json({ success: true, summary, is_gemini: false, fallback: true });
    }
  }

  const summary = generateSummary(profile);
  res.json({ success: true, summary, is_gemini: false, fallback: true });
});

// POST /api/ai/recommend-roles
router.post('/recommend-roles', auth, async (req, res) => {
  const { skills = [], headline = '', engine } = req.body;

  if (engine === 'gemini' && genAI) {
    try {
      const prompt = `
You are a senior career advisor. Based on the candidate's skills: ${JSON.stringify(skills)} and professional headline: "${headline}", recommend up to 4 exact job roles/titles that represent high-match career paths.

Return a JSON object with this exact structure:
{
  "roles": ["Role 1", "Role 2", "Role 3", "Role 4"]
}
`;
      const responseText = await generateGeminiContentWithFallback(prompt, { responseMimeType: 'application/json' });
      const parsedData = JSON.parse(responseText);
      return res.json({ success: true, roles: parsedData.roles, is_gemini: true });
    } catch (err) {
      console.error('Gemini recommend-roles error, falling back to local engine:', err);
      const roles = recommendRoles(skills, headline);
      return res.json({ success: true, roles, is_gemini: false, fallback: true });
    }
  }

  setTimeout(() => {
    const roles = recommendRoles(skills, headline);
    res.json({ success: true, roles, is_gemini: false });
  }, 400);
});

// Local rule-based ATS checker fallback
function localAtsCheck(text) {
  const lower = text.toLowerCase();
  
  // Find matched skills using SKILL_KEYWORDS defined earlier in the file
  const matched = [];
  for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      matched.push(skill);
    }
  }

  // Determine domain/field
  let missing = ['CI/CD', 'System Design', 'Unit Testing'];
  let suggestions = ['Scalability', 'Microservices', 'Agile Methodology'];
  
  if (matched.includes('Figma') || lower.includes('design') || lower.includes('ux')) {
    missing = ['Prototyping', 'Wireframing', 'User Research'];
    suggestions = ['Visual Design', 'Design Systems', 'User Journey Mapping'];
  } else if (matched.includes('Python') && (matched.includes('TensorFlow') || lower.includes('data') || lower.includes('learning'))) {
    missing = ['Machine Learning', 'Data Pipelines', 'SQL'];
    suggestions = ['Data Modeling', 'Deep Learning', 'Data Visualization'];
  } else if (matched.includes('React.js') || matched.includes('JavaScript') || matched.includes('CSS/SCSS')) {
    missing = ['TypeScript', 'Next.js', 'Web Performance'];
    suggestions = ['State Management', 'Responsive Layouts', 'Cross-Browser Compatibility'];
  } else if (matched.includes('Node.js') || matched.includes('PostgreSQL') || matched.includes('MongoDB')) {
    missing = ['Docker', 'Redis', 'API Security'];
    suggestions = ['Database Optimization', 'Serverless', 'Message Queues'];
  }

  // Formatting checks
  const formattingDetails = [];
  let formattingScore = 100;

  // Check contact info
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(lower);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(lower);
  
  if (hasEmail) {
    formattingDetails.push('Email address detected successfully.');
  } else {
    formattingDetails.push('Warning: Email address was not clearly identified.');
    formattingScore -= 15;
  }

  if (hasPhone) {
    formattingDetails.push('Phone number detected successfully.');
  } else {
    formattingDetails.push('Warning: Phone number was not clearly identified.');
    formattingScore -= 15;
  }

  // Check sections
  const hasExperience = lower.includes('experience') || lower.includes('work') || lower.includes('employment');
  const hasEducation = lower.includes('education') || lower.includes('university') || lower.includes('college');
  
  if (hasExperience) {
    formattingDetails.push('Work Experience section detected.');
  } else {
    formattingDetails.push('Warning: Work Experience section heading not found.');
    formattingScore -= 20;
  }

  if (hasEducation) {
    formattingDetails.push('Education section detected.');
  } else {
    formattingDetails.push('Warning: Education section heading not found.');
    formattingScore -= 15;
  }

  // Check text length
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 100) {
    formattingDetails.push('Warning: Resume content is extremely brief. Ensure it contains sufficient detail.');
    formattingScore -= 20;
  } else if (wordCount > 1500) {
    formattingDetails.push('Warning: Resume is very long. Consider condensing it to 1-2 pages.');
    formattingScore -= 10;
  } else {
    formattingDetails.push('Resume length is optimal (1-2 pages equivalent).');
  }

  // Recommendations
  const recommendations = [];
  if (matched.length < 5) {
    recommendations.push('Add more industry-specific technical skills and tools.');
  }
  if (!hasEmail || !hasPhone) {
    recommendations.push('Ensure your contact information is prominently displayed at the top of the resume.');
  }
  if (!hasExperience) {
    recommendations.push('Structure your work experience with clear headings, job titles, companies, and dates.');
  }
  if (formattingScore < 80) {
    recommendations.push('Use a standard, clean layout without complex multi-column grids or graphics that can confuse ATS parsers.');
  }
  recommendations.push('Quantify achievements with metrics and numbers (e.g., "Improved performance by 20%").');

  // Compute final score
  const skillsScore = Math.min(100, matched.length * 10 + 30);
  const keywordScore = Math.min(100, matched.length * 8 + 40);
  const score = Math.round((skillsScore * 0.4) + (formattingScore * 0.3) + (keywordScore * 0.3));

  return {
    score,
    skillsMatch: {
      matched: matched.slice(0, 10),
      missing: missing,
    },
    formatting: {
      score: formattingScore,
      details: formattingDetails,
    },
    keywords: {
      optimized: matched.slice(0, 8),
      suggestions: suggestions,
    },
    recommendations: recommendations,
  };
}

// POST /api/ai/public/ats-check (PUBLIC - No Auth required)
router.post('/public/ats-check', async (req, res) => {
  const { resumeBase64 } = req.body;
  if (!resumeBase64) {
    return res.status(400).json({ error: 'Please upload a PDF resume.' });
  }

  try {
    const buffer = Buffer.from(resumeBase64, 'base64');
    const pdfParse = require('pdf-parse');
    const parsed = await pdfParse(buffer);
    const text = parsed.text;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Failed to extract text from the PDF. Please make sure the PDF is not an image scan.' });
    }

    if (genAI) {
      try {
        const prompt = `
You are a professional ATS (Applicant Tracking System) simulator. Analyze the following resume text and generate a comprehensive ATS compatibility report.

Resume Text:
"${text}"

Return a JSON object with this exact structure:
{
  "score": Number (an overall score between 0 and 100),
  "skillsMatch": {
    "matched": ["Array of skills found in the resume"],
    "missing": ["Array of highly recommended skills for their field that are missing"]
  },
  "formatting": {
    "score": Number (formatting score between 0 and 100),
    "details": ["Array of formatting findings, e.g. 'Standard fonts used', 'No complex tables detected', 'Missing contact details', etc."]
  },
  "keywords": {
    "optimized": ["Array of keywords optimized in the resume"],
    "suggestions": ["Array of keyword suggestions to add to boost match rate"]
  },
  "recommendations": ["Array of concrete action items to improve the resume"]
}
`;
        const responseText = await generateGeminiContentWithFallback(prompt, { responseMimeType: 'application/json' });
        const analysis = JSON.parse(responseText);
        return res.json({ success: true, analysis, is_gemini: true });
      } catch (err) {
        console.error('Gemini ATS Check failed, falling back to local engine:', err);
        const analysis = localAtsCheck(text);
        return res.json({ success: true, analysis, is_gemini: false, fallback: true });
      }
    }

    // Local parser fallback
    const analysis = localAtsCheck(text);
    return res.json({ success: true, analysis, is_gemini: false });
  } catch (err) {
    console.error('ATS Checker error:', err);
    return res.status(500).json({ error: 'An error occurred while parsing the resume. Make sure it is a valid PDF.' });
  }
});

module.exports = router;
