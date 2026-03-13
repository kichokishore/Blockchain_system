import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/auth/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WalletsPage from './pages/WalletsPage';
import TransactionsPage from './pages/TransactionsPage';
import ContractsPage from './pages/ContractsPage';
import ExplorerPage from './pages/ExplorerPage';
import { AuditPage, AnalyticsPage } from './pages/AuditAnalyticsPage';
import { txAPI } from './utils/api';
import './index.css';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><span className="spinner" /><span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading ChainVault...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppLayout() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      try {
        const res = await txAPI.getPending();
        setPendingCount(res.data.data?.length || 0);
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="app-layout">
      <Sidebar pendingCount={pendingCount} />
      <div className="main-content">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/wallets" element={<WalletsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/contracts" element={<ContractsPage />} />
          <Route path="/explorer" element={<ExplorerPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/audit" element={
            <PrivateRoute roles={['ADMIN', 'AUDITOR']}><AuditPage /></PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><span className="spinner" /><span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading ChainVault...</span></div>;

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/*" element={
        <PrivateRoute><AppLayout /></PrivateRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-bright)',
              borderRadius: '10px',
              fontFamily: 'var(--font-display)',
              fontSize: '14px'
            },
            success: { iconTheme: { primary: '#00ff88', secondary: '#080c10' } },
            error: { iconTheme: { primary: '#ff4466', secondary: '#080c10' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
