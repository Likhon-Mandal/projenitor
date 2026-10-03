import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Directory from './pages/Directory';
import Profile from './pages/Profile';
import Explorer from './pages/Explorer';
import History from './pages/History';
import CommitteeBoard from './pages/CommitteeBoard';
import EminentFigures from './pages/EminentFigures';
import EventsAndNotices from './pages/EventsAndNotices';
import Help from './pages/Help';
import Admin from './pages/Admin';
import FindRelation from './pages/FindRelation';
import RecycleBin from './pages/RecycleBin';
import SpousesDirectory from './pages/SpousesDirectory';

// Auth Pages (no Layout wrapper)
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import UserAuth from './pages/UserAuth';

// Dashboard Pages (no Layout wrapper)
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Main app pages — with Layout (header + footer) */}
          <Route path="/*" element={
            <ErrorBoundary>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/explorer/*" element={<Explorer />} />
                  <Route path="/directory" element={<Directory />} />
                  <Route path="/member/:id" element={<Profile />} />
                  <Route path="/board" element={<EventsAndNotices />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/committee" element={<CommitteeBoard />} />
                  <Route path="/eminent" element={<EminentFigures />} />
                  <Route path="/admin" element={
                    <ProtectedRoute requiredRole="admin">
                      <Admin />
                    </ProtectedRoute>
                  } />
                  <Route path="/relation" element={<FindRelation />} />
                  <Route path="/spouses" element={<SpousesDirectory />} />
                  <Route path="/recycle-bin" element={
                    <ProtectedRoute requiredRole="admin">
                      <RecycleBin />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/superadmin" element={
                    <ProtectedRoute requiredRole="superadmin">
                      <SuperAdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/admin" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/user" element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  } />

                  {/* Auth pages — now rendered with Navbar (Header) & Footer */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/user-auth" element={<UserAuth />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/change-password" element={
                    <ProtectedRoute requiredRole="admin">
                      <ChangePassword />
                    </ProtectedRoute>
                  } />
                </Routes>
              </Layout>
            </ErrorBoundary>
          } />
        </Routes>
      </Router>
    </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
