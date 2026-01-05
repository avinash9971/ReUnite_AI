import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { UserLogin } from './pages/UserLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { ReportMissing } from './pages/ReportMissing';
import { UploadFoundPerson } from './pages/UploadFoundPerson';
import { MatchingResults } from './pages/MatchingResults';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/user-login" element={<UserLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route
            path="/report-missing"
            element={
              <ProtectedRoute requiredRole="user">
                <ReportMissing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload-found-person"
            element={
              <ProtectedRoute requiredRole="admin">
                <UploadFoundPerson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matching-results/:id"
            element={
              <ProtectedRoute requiredRole="admin">
                <MatchingResults />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
