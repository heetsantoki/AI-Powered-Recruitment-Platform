const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Interview = require('../models/Interview');
const CandidateProfile = require('../models/CandidateProfile');
const Experience = require('../models/Experience');
const Skill = require('../models/Skill');
const Project = require('../models/Project');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✦ Gemini Interview Engine initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini AI client inside interview routes:', err);
  }
}

// Middleware: Check if Gemini is configured
function requireGemini(req, res, next) {
  if (!process.env.GEMINI_API_KEY || !genAI) {
    return res.status(503).json({
      error: 'AI Interview Engine is currently offline. Please configure a valid GEMINI_API_KEY in the backend environment to proceed.'
    });
  }
  next();
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

// GET /api/interview - Fetch own interview session and report
router.get('/', auth, async (req, res) => {
  try {
    const interview = await Interview.findOne({ user_id: req.user.id });
    res.json({ success: true, interview });
  } catch (err) {
    console.error('Fetch interview error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/interview/start - Start/Reset an interview session
router.post('/start', auth, requireGemini, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ error: 'Target role is required to start the interview.' });
    }

    // Gather candidate's profile context
    const profile = await CandidateProfile.findOne({ user_id: req.user.id });
    const experiences = await Experience.find({ user_id: req.user.id }).sort({ sort_order: 1 });
    const skills = await Skill.find({ user_id: req.user.id });
    const projects = await Project.find({ user_id: req.user.id }).sort({ sort_order: 1 });

    const skillNames = skills.map(s => `${s.name} (${s.level})`).join(', ');
    const listedProjectsText = projects.length > 0 
      ? projects.map((p, idx) => `Project ${idx + 1}: "${p.title}" - Description: "${p.description}"`).join('\n')
      : 'None listed';
    const expSummary = experiences.map(e => `${e.job_title} at ${e.company} (${e.description || ''})`).join(' | ');

    // Initialize Mongoose model (overwrite if already exists for this user)
    let interview = await Interview.findOne({ user_id: req.user.id });
    if (interview) {
      interview.status = 'in_progress';
      interview.role = role;
      interview.current_question_index = 0;
      interview.chat_history = [];
      interview.evaluation = null;
      interview.updated_at = Date.now();
    } else {
      interview = new Interview({
        user_id: req.user.id,
        role,
        status: 'in_progress',
        current_question_index: 0,
        chat_history: []
      });
    }

    // Call Gemini to generate the custom first question
    const systemPrompt = `
You are a senior technical interviewer role-playing as the AI Technical Lead evaluating a candidate for the target role of "${role}".

Candidate's listed projects:
${listedProjectsText}

Candidate's listed skills:
${skillNames || 'None listed'}

Your task is to ask the 1st technical screening question of the interview.
CRITICAL RULES FOR BREVITY & DIFFICULTY:
1. You MUST introduce yourself briefly and ask about one of the candidate's actual listed projects above. Focus strictly on its purpose, features, or technologies.
2. If the candidate has no projects listed in their profile, ask them to describe any technical project they have built or worked on.
3. Keep the question extremely short, conversational, and direct (exactly ONE single-sentence question under 20 words total).
4. No multi-part questions, long paragraphs, preambles, or markdown formatting. Keep it friendly and natural.
   - Example: "Hi! I'm the AI Tech Lead here. Can you explain the main purpose of your [Project Name] project?"
`;

    const firstQuestionText = await generateGeminiContentWithFallback(systemPrompt);

    interview.chat_history.push({
      sender: 'ai',
      text: firstQuestionText,
      timestamp: new Date()
    });

    await interview.save();

    res.json({ success: true, interview });
  } catch (err) {
    console.error('Start interview error:', err);
    res.status(500).json({ error: 'Server error starting interview.' });
  }
});

// POST /api/interview/message - Send reply and get next question/evaluation
router.post('/message', auth, requireGemini, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const interview = await Interview.findOne({ user_id: req.user.id });
    if (!interview || interview.status !== 'in_progress') {
      return res.status(400).json({ error: 'No active interview in progress. Please start a session first.' });
    }

    // Append user response
    interview.chat_history.push({
      sender: 'candidate',
      text: message.trim(),
      timestamp: new Date()
    });

    // Gather candidate's profile context for dynamic questions
    const profile = await CandidateProfile.findOne({ user_id: req.user.id });
    const experiences = await Experience.find({ user_id: req.user.id }).sort({ sort_order: 1 });
    const skills = await Skill.find({ user_id: req.user.id });
    const projects = await Project.find({ user_id: req.user.id }).sort({ sort_order: 1 });

    const skillNames = skills.map(s => `${s.name} (${s.level})`).join(', ');
    const listedProjectsText = projects.length > 0 
      ? projects.map((p, idx) => `Project ${idx + 1}: "${p.title}" - Description: "${p.description}"`).join('\n')
      : 'None listed';
    const expSummary = experiences.map(e => `${e.job_title} at ${e.company} (${e.description || ''})`).join(' | ');

    const currentIdx = interview.current_question_index; // 0, 1, 2, 3, 4

    // 5-Question Interview Loop:
    // If they just answered question 1, 2, 3, or 4 (indices 0, 1, 2, 3):
    if (currentIdx < 4) {
      const transcript = interview.chat_history.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');
      
      let questionPrompt = '';
      
      // Question 2 (currentIdx === 0): Second question should also be project-based
      if (currentIdx === 0) {
        questionPrompt = `
You are a senior technical interviewer role-playing as the AI Technical Lead evaluating a candidate for the target role of "${interview.role}".

Candidate's listed projects:
${listedProjectsText}

Here is the conversation transcript so far:
${transcript}

Your task is to ask the 2nd technical screening question of the interview.
CRITICAL RULES FOR BREVITY & DIFFICULTY:
1. This question MUST be based on the candidate's actual listed projects. You can ask about technologies used, a key decision, a challenge faced, or the outcome/results.
2. If the candidate has no projects listed in their profile, ask them to describe a challenge they faced on any technical project they have built or worked on.
3. Keep the question extremely basic/intermediate level (internship or entry-level job difficulty). No complex system design, senior scaling, or deep database architecture.
4. React to their last response in exactly 2-3 words (e.g. "Makes sense.", "That is cool.").
5. Ask exactly ONE short, single-sentence question of under 15 words total.
6. Do NOT use markdown. Keep the tone completely conversational.
`;
      } else {
        // Questions 3, 4, 5 (currentIdx >= 1): Technical conceptual questions based on listed skills and role
        questionPrompt = `
You are a senior technical interviewer role-playing as the AI Technical Lead evaluating a candidate for the target role of "${interview.role}".

Candidate's listed skills:
${skillNames || 'None listed'}

Here is the conversation transcript so far:
${transcript}

Your task is to ask the next technical question (Question ${currentIdx + 2} of 5).
CRITICAL RULES FOR BREVITY & DIFFICULTY:
1. The question MUST be basic to intermediate, suitable for an internship, fresher, or junior developer interview.
2. The question MUST be strictly relevant to the candidate's target role ("${interview.role}") and their listed skills.
   - If target role is Full Stack Developer: Focus on basic React, Node.js, APIs, MongoDB, state management, or authentication.
   - If target role is Frontend Developer: Focus on React, JavaScript, Hooks, Virtual DOM, or state management.
   - If target role is Backend Developer: Focus on Node.js, Express.js, APIs, JWT, or basic database queries.
   - If target role is Data Scientist: Focus on Machine Learning basics, NLP, TensorFlow, model training, or data preprocessing.
3. DO NOT ask unrelated questions. (e.g. Do NOT ask a Data Scientist about REST APIs, Express, or frontend state management unless those skills are explicitly listed in their profile).
4. ABSOLUTELY NO advanced, senior-level, system design, microservices, high-level database architecture, massive scaling, or highly theoretical questions. Keep it appropriate for entry-level or junior applicants.
5. React to their last response in exactly 2-3 words (e.g. "Got it.", "Perfect.").
6. Ask exactly ONE short, single-sentence question of under 15 words total.
7. Do NOT use markdown. Keep it conversational.
`;
      }

      const nextQuestionText = await generateGeminiContentWithFallback(questionPrompt);

      interview.chat_history.push({
        sender: 'ai',
        text: nextQuestionText,
        timestamp: new Date()
      });

      interview.current_question_index += 1;
      interview.updated_at = Date.now();
      await interview.save();

      return res.json({ success: true, isCompleted: false, interview });
    } else {
      // Completed the 5th question - Perform overall evaluation
      const transcript = interview.chat_history.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');

      const evaluationPrompt = `
You are a senior career advisor and technical recruitment expert. Evaluate the following technical role-play interview transcript between a candidate and an AI Technical Lead.
The candidate was interviewing for the role of "${interview.role}".

Transcript:
${transcript}

Analyze the candidate's technical skills, architectural logic, communication effectiveness, and problem-solving adaptability. Provide a detailed, structural JSON evaluation report.
The output MUST be a JSON object with this exact structure:
{
  "score": integer (a realistic grade between 0 and 100 based on their communication depth, technical correctness, and depth of explanation),
  "feedback": "string (a high-quality, professional, constructive summary paragraph evaluating their fit, strengths, and communication style)",
  "strengths": ["array of 2-3 specific, positive highlights from their answers"],
  "growth_areas": ["array of 2-3 constructive development points where they could elaborate or improve technically"],
  "validated_badges": ["array of 2-3 concise tech/soft badges they validated, e.g. 'React Architecture', 'System Scalability', 'Precise Communicator', 'Database Design'"]
}
`;

      const responseText = await generateGeminiContentWithFallback(evaluationPrompt, { responseMimeType: 'application/json' });
      const parsedData = JSON.parse(responseText);

      // Save evaluation report
      interview.status = 'completed';
      interview.evaluation = {
        score: parsedData.score,
        feedback: parsedData.feedback,
        strengths: parsedData.strengths,
        growth_areas: parsedData.growth_areas,
        validated_badges: parsedData.validated_badges,
        conducted_at: new Date()
      };
      interview.updated_at = Date.now();
      await interview.save();

      return res.json({ success: true, isCompleted: true, interview });
    }
  } catch (err) {
    console.error('Message handling/evaluation error:', err);
    res.status(500).json({ error: 'Server error processing interview message.' });
  }
});

module.exports = router;
