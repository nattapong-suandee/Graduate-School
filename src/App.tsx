import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRole } from './lib/utils';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import Schedule from './pages/Schedule';
import ManageContent from './pages/ManageContent';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ThesisTracker from './pages/ThesisTracker';
import ComprehensiveExam from './pages/ComprehensiveExam';
import Graduation from './pages/Graduation';
import Profile from './pages/Profile';
import { Loader2 } from 'lucide-react';

// Guard for authenticated users
function PrivateRoute({ children, role }: { children: React.ReactNode, role?: UserRole }) {
  const { user, profile, loading, isPreviewMode } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
        <div className="mesh-bg" />
        <div className="w-20 h-20 rounded-[28px] bg-white text-slate-900 border border-slate-100 shadow-2xl flex items-center justify-center font-black text-3xl tracking-tighter animate-bounce">
          BU
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synchronizing Portal</p>
        </div>
      </div>
    );
  }

  if (!user && localStorage.getItem('adminEmail') !== 'admin.bu.ac.th') {
    return <Navigate to={role === UserRole.ADMIN ? "/admin/login" : "/login"} replace />;
  }

  // Emergency Bypass for Admin
  const isBypassAdmin = localStorage.getItem('adminEmail') === 'admin.bu.ac.th';
  
  if (role && profile?.role !== role && !isBypassAdmin) {
    // Exception for Admins in Preview Mode wanting to see student pages
    if (isPreviewMode && role === UserRole.STUDENT && profile?.role === UserRole.ADMIN) {
      return <>{children}</>;
    }

    // If trying to access admin area without admin role
    if (role === UserRole.ADMIN) {
      return <Navigate to="/admin/login" state={{ error: 'Access Denied: Admin Only' }} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Redirect based on role if already logged in and at /dashboard
function DashboardDispatcher() {
  const { profile, loading, isPreviewMode } = useAuth();

  if (loading) return null;

  if (profile?.role === UserRole.ADMIN && !isPreviewMode) {
    return <AdminDashboard />;
  }

  return <StudentDashboard />;
}

function AppContent() {
  return (
    <>
      <div className="mesh-bg" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      
      {/* Shared/Protected Routes */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Layout>
            <DashboardDispatcher />
          </Layout>
        </PrivateRoute>
      } />

      {/* Admin Specific */}
      <Route path="/admin/dashboard" element={
        <PrivateRoute role={UserRole.ADMIN}>
          <Layout>
            <AdminDashboard />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/admin/manage" element={
        <PrivateRoute role={UserRole.ADMIN}>
          <Layout>
            <ManageContent />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/admin/settings" element={
        <PrivateRoute role={UserRole.ADMIN}>
          <Layout>
            <Profile />
          </Layout>
        </PrivateRoute>
      } />

      {/* Student Specific */}
      <Route path="/schedule" element={
        <PrivateRoute role={UserRole.STUDENT}>
          <Layout>
            <Schedule />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/comprehensive-exam" element={
        <PrivateRoute role={UserRole.STUDENT}>
          <Layout>
            <ComprehensiveExam />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/thesis" element={
        <PrivateRoute role={UserRole.STUDENT}>
          <Layout>
            <ThesisTracker />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/graduation" element={
        <PrivateRoute role={UserRole.STUDENT}>
          <Layout>
            <Graduation />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <Layout>
            <Profile />
          </Layout>
        </PrivateRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
