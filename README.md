# AI-Powered Recruitment Platform

A modern recruitment platform where candidates build smart, AI-assisted profiles without uploading a resume. Recruiters get a structured dashboard to discover, evaluate, and shortlist talent.

## Project Structure
- `/frontend` → Frontend code (React + Vite)
- `/backend` → Backend code (Node.js + Express)

---

## 🚀 Tech Stack

### Frontend
- **React 18 + Vite**: Fast, modern UI development.
- **Vanilla CSS**: Custom design system with CSS variables, dark mode, and glassmorphism.
- **React Router v6**: Client-side routing.
- **Axios**: API requests.
- **jsPDF**: Client-side resume PDF generation.

### Backend
- **Node.js + Express.js**: Fast and scalable RESTful API.
- **SQLite (`better-sqlite3`)**: Zero-config, file-based database for easy setup.
- **JWT + bcryptjs**: Secure authentication and password hashing.
- **Custom Rule-based AI Engine**: NLP parsing without external API dependencies.

---

## 🧠 Approach Explanation

### The Problem
Traditional recruitment relies on PDF resumes, which are often unstructured, unparseable, and biased. Candidates struggle to format them correctly, and recruiters struggle to extract standardized data from them.

### Our Solution
Instead of uploading a resume, candidates are guided through a conversational, AI-driven profile builder:
1. **Interactive Experience Extraction**: Candidates describe their work in plain English. The AI parses this into structured data (Job Title, Company, Dates, Achievements).
2. **Smart Skill Suggestions**: Based on the candidate's target role, the system recommends relevant technical and soft skills.
3. **Automated Summaries**: The AI generates a professional summary paragraph from the provided profile data.

Recruiters receive a standardized, structured dashboard to view candidate profiles, compare skills side-by-side, and manage shortlists efficiently.

---

## 📌 Justification (Design & Architecture Decisions)

1. **No Resume Uploads**: By forcing structured input via AI guidance, we eliminate parsing errors and ensure all candidates are evaluated on a level playing field with standardized data formats.
2. **Local AI Parsing / No External APIs**: To ensure privacy, reliability, and ease of evaluation without requiring paid API keys (like OpenAI), we implemented a custom, regex/rule-based NLP parsing engine directly in the backend.
3. **SQLite Database**: We chose SQLite to provide a "zero-configuration" experience. Evaluators and developers can clone the repo and run it immediately without needing to install or configure MongoDB, PostgreSQL, or Docker.
4. **Client-Side PDF Generation**: To reduce server load and storage costs, resumes are generated directly in the browser using `jsPDF`.
5. **Real-Time Auto-Save**: Candidate profiles automatically save changes every 1.5 seconds, preventing data loss during the multi-step onboarding process.

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Backend Setup

```bash
cd backend
npm install
node db/seed.js      # Creates database and seeds demo users
node server.js       # Starts the server on http://localhost:5000
```

### 2. Frontend Setup

Open a **new terminal tab/window**:

```bash
cd frontend
npm install
npm run dev          # Starts the dev server on http://localhost:5173
```

Open **http://localhost:5173** in your browser to view the application.

---

## 🔑 Demo Login Credentials

You can use the following pre-seeded accounts to test the application immediately:

| Role | Email | Password |
|------|-------|----------|
| **Candidate** | `hire-me@anshumat.org` | `HireMe@2025!` |
| **Recruiter** | `recruiter@demo.com` | `HireMe@2025!` |

> *Note: The demo candidate has a fully pre-seeded profile with experiences, skills, projects, and education.*
