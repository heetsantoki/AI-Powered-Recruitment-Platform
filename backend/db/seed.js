require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database');

function seed() {
  console.log('🌱 Seeding database...');

  // Demo candidate
  const candidateEmail = 'hire-me@anshumat.org';
  const candidatePassword = 'HireMe@2025!';
  const candidateHash = bcrypt.hashSync(candidatePassword, 10);

  let candidateUser = db.prepare('SELECT id FROM users WHERE email = ?').get(candidateEmail);
  if (!candidateUser) {
    const result = db.prepare(
      'INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)'
    ).run(candidateEmail, candidateHash, 'candidate', 'Alex Johnson');
    candidateUser = { id: result.lastInsertRowid };
    console.log('✅ Demo candidate created:', candidateEmail);
  } else {
    console.log('ℹ️  Demo candidate already exists:', candidateEmail);
  }

  // Demo recruiter
  const recruiterEmail = 'recruiter@demo.com';
  const recruiterHash = bcrypt.hashSync('HireMe@2025!', 10);
  let recruiterUser = db.prepare('SELECT id FROM users WHERE email = ?').get(recruiterEmail);
  if (!recruiterUser) {
    const result = db.prepare(
      'INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)'
    ).run(recruiterEmail, recruiterHash, 'recruiter', 'Sarah Mitchell');
    recruiterUser = { id: result.lastInsertRowid };
    console.log('✅ Demo recruiter created:', recruiterEmail);
  } else {
    console.log('ℹ️  Demo recruiter already exists:', recruiterEmail);
  }

  // Seed candidate profile
  const existingProfile = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(candidateUser.id);
  if (!existingProfile) {
    db.prepare(`
      INSERT INTO candidate_profiles (user_id, headline, summary, location, phone, linkedin, github, portfolio, completion_percent, is_submitted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      candidateUser.id,
      'Full-Stack Developer | React & Node.js Enthusiast',
      'Passionate software developer with 2+ years of experience building scalable web applications. Skilled in React, Node.js, and cloud technologies. Looking for opportunities to work on impactful products that solve real-world problems.',
      'Bangalore, India',
      '+91 98765 43210',
      'linkedin.com/in/alexjohnson',
      'github.com/alexjohnson',
      'alexjohnson.dev',
      100,
      1
    );

    // Experiences
    db.prepare(`
      INSERT INTO experiences (user_id, job_title, company, location, start_date, end_date, is_current, description, bullets, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      candidateUser.id,
      'Software Engineer Intern',
      'TechCorp Solutions',
      'Bangalore, India',
      '2023-06',
      '2023-12',
      0,
      'Developed and maintained React-based frontend features for an e-commerce platform serving 1M+ users.',
      JSON.stringify([
        'Built reusable component library reducing development time by 30%',
        'Implemented lazy loading and code splitting improving page load by 45%',
        'Collaborated with design team to implement pixel-perfect UI components',
        'Wrote unit tests achieving 85% code coverage'
      ]),
      0
    );

    db.prepare(`
      INSERT INTO experiences (user_id, job_title, company, location, start_date, end_date, is_current, description, bullets, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      candidateUser.id,
      'Frontend Developer',
      'StartupXYZ',
      'Remote',
      '2024-01',
      null,
      1,
      'Leading frontend development for a SaaS product used by 500+ businesses.',
      JSON.stringify([
        'Architected and built dashboard with React, TypeScript, and Redux Toolkit',
        'Integrated REST APIs and WebSocket for real-time data updates',
        'Mentored 2 junior developers and conducted code reviews',
        'Reduced bundle size by 40% through tree shaking and dynamic imports'
      ]),
      1
    );

    // Skills
    const skills = [
      { name: 'React.js', level: 'Advanced', category: 'Frontend' },
      { name: 'Node.js', level: 'Intermediate', category: 'Backend' },
      { name: 'JavaScript', level: 'Advanced', category: 'Language' },
      { name: 'TypeScript', level: 'Intermediate', category: 'Language' },
      { name: 'Python', level: 'Intermediate', category: 'Language' },
      { name: 'MongoDB', level: 'Intermediate', category: 'Database' },
      { name: 'PostgreSQL', level: 'Beginner', category: 'Database' },
      { name: 'Docker', level: 'Beginner', category: 'DevOps' },
      { name: 'Git', level: 'Advanced', category: 'Tools' },
      { name: 'REST APIs', level: 'Advanced', category: 'Backend' },
      { name: 'GraphQL', level: 'Beginner', category: 'Backend' },
      { name: 'Redux', level: 'Intermediate', category: 'Frontend' },
    ];
    const skillStmt = db.prepare('INSERT INTO skills (user_id, name, level, category) VALUES (?, ?, ?, ?)');
    skills.forEach(s => skillStmt.run(candidateUser.id, s.name, s.level, s.category));

    // Projects
    db.prepare(`
      INSERT INTO projects (user_id, title, description, tech_stack, live_url, github_url, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      candidateUser.id,
      'SmartShop - E-commerce Platform',
      'A fully-featured e-commerce platform with real-time inventory management, AI-powered product recommendations, and a seamless checkout experience.',
      JSON.stringify(['React', 'Node.js', 'MongoDB', 'Stripe', 'Redis']),
      'smartshop-demo.vercel.app',
      'github.com/alexjohnson/smartshop',
      0
    );
    db.prepare(`
      INSERT INTO projects (user_id, title, description, tech_stack, live_url, github_url, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      candidateUser.id,
      'DevCollab - Real-time Code Editor',
      'A collaborative code editor supporting simultaneous multi-user editing, syntax highlighting for 50+ languages, and integrated video chat.',
      JSON.stringify(['React', 'WebSocket', 'Monaco Editor', 'WebRTC', 'Express']),
      'devcollab.live',
      'github.com/alexjohnson/devcollab',
      1
    );

    // Education
    db.prepare(`
      INSERT INTO education (user_id, degree, field_of_study, institution, start_year, end_year, grade)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      candidateUser.id,
      'Bachelor of Technology',
      'Computer Science & Engineering',
      'Bangalore Institute of Technology',
      '2020',
      '2024',
      '8.4 CGPA'
    );

    console.log('✅ Demo candidate profile seeded with experiences, skills, projects, education');
  }

  // Seed a few more candidates for recruiter view
  const extraCandidates = [
    {
      email: 'priya.sharma@example.com', name: 'Priya Sharma',
      headline: 'UI/UX Designer & Frontend Developer',
      summary: 'Creative designer with a strong eye for detail and 3 years of experience crafting beautiful digital experiences.',
      location: 'Mumbai, India',
      skills: [
        { name: 'Figma', level: 'Advanced', category: 'Design' },
        { name: 'React.js', level: 'Intermediate', category: 'Frontend' },
        { name: 'CSS/SCSS', level: 'Advanced', category: 'Frontend' },
        { name: 'Adobe XD', level: 'Advanced', category: 'Design' },
        { name: 'JavaScript', level: 'Intermediate', category: 'Language' },
      ]
    },
    {
      email: 'rahul.verma@example.com', name: 'Rahul Verma',
      headline: 'Backend Engineer | Python & Django Expert',
      summary: 'Backend-focused engineer passionate about APIs, microservices, and system design.',
      location: 'Hyderabad, India',
      skills: [
        { name: 'Python', level: 'Advanced', category: 'Language' },
        { name: 'Django', level: 'Advanced', category: 'Backend' },
        { name: 'PostgreSQL', level: 'Advanced', category: 'Database' },
        { name: 'Docker', level: 'Intermediate', category: 'DevOps' },
        { name: 'AWS', level: 'Intermediate', category: 'Cloud' },
      ]
    },
    {
      email: 'meera.nair@example.com', name: 'Meera Nair',
      headline: 'Data Scientist | ML & AI Enthusiast',
      summary: 'Data scientist with expertise in machine learning, NLP, and data visualization. Graduate researcher in AI.',
      location: 'Chennai, India',
      skills: [
        { name: 'Python', level: 'Advanced', category: 'Language' },
        { name: 'TensorFlow', level: 'Advanced', category: 'ML/AI' },
        { name: 'Scikit-learn', level: 'Advanced', category: 'ML/AI' },
        { name: 'SQL', level: 'Intermediate', category: 'Database' },
        { name: 'Tableau', level: 'Intermediate', category: 'Tools' },
      ]
    }
  ];

  const passwordHash = bcrypt.hashSync('Demo@123', 10);
  for (const c of extraCandidates) {
    let u = db.prepare('SELECT id FROM users WHERE email = ?').get(c.email);
    if (!u) {
      const r = db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)').run(c.email, passwordHash, 'candidate', c.name);
      u = { id: r.lastInsertRowid };
      db.prepare(`
        INSERT INTO candidate_profiles (user_id, headline, summary, location, completion_percent, is_submitted)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(u.id, c.headline, c.summary, c.location, 80, 1);
      const ss = db.prepare('INSERT INTO skills (user_id, name, level, category) VALUES (?, ?, ?, ?)');
      c.skills.forEach(s => ss.run(u.id, s.name, s.level, s.category));
      console.log('✅ Extra candidate seeded:', c.email);
    }
  }

  console.log('\n🎉 Seeding complete!\n');
  console.log('Demo Logins:');
  console.log('  Candidate: hire-me@anshumat.org / HireMe@2025!');
  console.log('  Recruiter: recruiter@demo.com  / HireMe@2025!');
}

seed();
