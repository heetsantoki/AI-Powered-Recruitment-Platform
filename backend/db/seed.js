require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const Experience = require('../models/Experience');
const Skill = require('../models/Skill');
const Project = require('../models/Project');
const Education = require('../models/Education');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🌱 Seeding database...');

    const candidateEmail = 'hire-me@anshumat.org';
    const candidateHash = bcrypt.hashSync('HireMe@2025!', 10);
    
    let candidateUser = await User.findOne({ email: candidateEmail });
    if (!candidateUser) {
      candidateUser = await User.create({ email: candidateEmail, password: candidateHash, role: 'candidate', name: 'Alex Johnson' });
      console.log('✅ Demo candidate created:', candidateEmail);
    } else {
      console.log('ℹ️  Demo candidate already exists:', candidateEmail);
    }

    const recruiterEmail = 'recruiter@demo.com';
    let recruiterUser = await User.findOne({ email: recruiterEmail });
    if (!recruiterUser) {
      await User.create({ email: recruiterEmail, password: candidateHash, role: 'recruiter', name: 'Sarah Mitchell' });
      console.log('✅ Demo recruiter created:', recruiterEmail);
    }

    const existingProfile = await CandidateProfile.findOne({ user_id: candidateUser._id });
    if (!existingProfile) {
      await CandidateProfile.create({
        user_id: candidateUser._id,
        headline: 'Full-Stack Developer | React & Node.js Enthusiast',
        summary: 'Passionate software developer with 2+ years of experience.',
        location: 'Bangalore, India',
        phone: '+91 98765 43210',
        linkedin: 'linkedin.com/in/alexjohnson',
        github: 'github.com/alexjohnson',
        portfolio: 'alexjohnson.dev',
        completion_percent: 100,
        is_submitted: 1
      });

      await Experience.create([
        { user_id: candidateUser._id, job_title: 'Software Engineer Intern', company: 'TechCorp Solutions', location: 'Bangalore, India', start_date: '2023-06', end_date: '2023-12', is_current: 0, description: 'Developed React frontend', bullets: ['Built reusable component library'], sort_order: 0 },
        { user_id: candidateUser._id, job_title: 'Frontend Developer', company: 'StartupXYZ', location: 'Remote', start_date: '2024-01', is_current: 1, description: 'Leading frontend development', bullets: ['Architected dashboard'], sort_order: 1 }
      ]);

      const skills = [
        { name: 'React.js', level: 'Advanced', category: 'Frontend' },
        { name: 'Node.js', level: 'Intermediate', category: 'Backend' },
        { name: 'JavaScript', level: 'Advanced', category: 'Language' },
        { name: 'Git', level: 'Advanced', category: 'Tools' }
      ];
      await Skill.create(skills.map(s => ({ ...s, user_id: candidateUser._id })));

      await Project.create([
        { user_id: candidateUser._id, title: 'SmartShop', description: 'E-commerce Platform', tech_stack: ['React', 'Node.js'], sort_order: 0 },
        { user_id: candidateUser._id, title: 'DevCollab', description: 'Real-time Code Editor', tech_stack: ['React', 'WebSocket'], sort_order: 1 }
      ]);

      await Education.create({
        user_id: candidateUser._id, degree: 'Bachelor of Technology', field_of_study: 'CSE', institution: 'Bangalore Institute of Technology', start_year: '2020', end_year: '2024', grade: '8.4 CGPA'
      });
      console.log('✅ Demo candidate profile seeded with experiences, skills, projects, education');
    }

    console.log('\n🎉 Seeding complete!\n');
    console.log('Demo Logins:');
    console.log('  Candidate: hire-me@anshumat.org / HireMe@2025!');
    console.log('  Recruiter: recruiter@demo.com  / HireMe@2025!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();
