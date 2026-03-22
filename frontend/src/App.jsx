import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import ProfileBuilder from './pages/ProfileBuilder'
import ProfilePreview from './pages/ProfilePreview'
import RecruiterDashboard from './pages/RecruiterDashboard'
import CandidateView from './pages/CandidateView'
import Shortlisted from './pages/Shortlisted'
import Compare from './pages/Compare'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'recruiter' ? '/recruiter/dashboard' : '/profile/builder'} replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<ProtectedRoute role="candidate"><Onboarding /></ProtectedRoute>} />
          <Route path="/profile/builder" element={<ProtectedRoute role="candidate"><ProfileBuilder /></ProtectedRoute>} />
          <Route path="/profile/view" element={<ProtectedRoute role="candidate"><ProfilePreview /></ProtectedRoute>} />
          <Route path="/recruiter/dashboard" element={<ProtectedRoute role="recruiter"><RecruiterDashboard /></ProtectedRoute>} />
          <Route path="/recruiter/candidate/:id" element={<ProtectedRoute role="recruiter"><CandidateView /></ProtectedRoute>} />
          <Route path="/recruiter/shortlisted" element={<ProtectedRoute role="recruiter"><Shortlisted /></ProtectedRoute>} />
          <Route path="/recruiter/compare" element={<ProtectedRoute role="recruiter"><Compare /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
