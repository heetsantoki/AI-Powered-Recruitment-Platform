import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ThemeCustomizer from './components/ThemeCustomizer'
import Landing from './pages/Landing'
import AtsChecker from './pages/AtsChecker'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import ProfileBuilder from './pages/ProfileBuilder'
import ProfilePreview from './pages/ProfilePreview'
import InterviewSession from './pages/InterviewSession'
import RecruiterDashboard from './pages/RecruiterDashboard'
import CandidateView from './pages/CandidateView'
import Shortlisted from './pages/Shortlisted'
import Compare from './pages/Compare'
import CompanyProfile from './pages/CompanyProfile'

function ProtectedRoute({ children, role, allowIncompleteCompanyProfile = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  
  if (role && user.role !== role) {
    if (user.role === 'recruiter') {
      return <Navigate to={user.is_company_profile_completed ? '/recruiter/dashboard' : '/recruiter/profile/complete'} replace />
    } else {
      return <Navigate to="/profile/builder" replace />
    }
  }

  if (user.role === 'recruiter') {
    if (!user.is_company_profile_completed && !allowIncompleteCompanyProfile) {
      return <Navigate to="/recruiter/profile/complete" replace />
    }
    if (user.is_company_profile_completed && allowIncompleteCompanyProfile) {
      return <Navigate to="/recruiter/dashboard" replace />
    }
  }

  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/ats-checker" element={<AtsChecker />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<ProtectedRoute role="candidate"><Onboarding /></ProtectedRoute>} />
            <Route path="/profile/builder" element={<ProtectedRoute role="candidate"><ProfileBuilder /></ProtectedRoute>} />
            <Route path="/profile/view" element={<ProtectedRoute role="candidate"><ProfilePreview /></ProtectedRoute>} />
            <Route path="/profile/interview" element={<ProtectedRoute role="candidate"><InterviewSession /></ProtectedRoute>} />
            <Route path="/recruiter/dashboard" element={<ProtectedRoute role="recruiter"><RecruiterDashboard /></ProtectedRoute>} />
            <Route path="/recruiter/candidate/:id" element={<ProtectedRoute role="recruiter"><CandidateView /></ProtectedRoute>} />
            <Route path="/recruiter/shortlisted" element={<ProtectedRoute role="recruiter"><Shortlisted /></ProtectedRoute>} />
            <Route path="/recruiter/compare" element={<ProtectedRoute role="recruiter"><Compare /></ProtectedRoute>} />
            <Route path="/recruiter/profile/complete" element={<ProtectedRoute role="recruiter" allowIncompleteCompanyProfile={true}><CompanyProfile /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ThemeCustomizer />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
