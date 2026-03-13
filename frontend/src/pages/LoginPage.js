import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Lock, Mail, Eye, EyeOff, User, Shield } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@blockchain.sys', password: 'Admin@123456', role: 'ADMIN' },
  { label: 'User (Alice)', email: 'alice@blockchain.sys', password: 'Alice@123456', role: 'USER' },
  { label: 'Auditor', email: 'auditor@blockchain.sys', password: 'Auditor@123456', role: 'AUDITOR' },
];

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', username: '', fullName: '' });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const data = await register(form);
      toast.success('Account created! 500 tokens added to your wallet.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (acc) => {
    setLoading(true);
    try {
      await login(acc.email, acc.password);
      toast.success(`Logged in as ${acc.label}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error('Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div className="auth-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>⛓️</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>ChainVault</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>SECURE BLOCKCHAIN SYSTEM</div>
            </div>
          </div>
        </div>

        <div className="auth-card">
          {/* Tab */}
          <div className="tab-nav" style={{ marginBottom: '24px' }}>
            <div className={`tab-item ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign In</div>
            <div className={`tab-item ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Create Account</div>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required style={{ paddingRight: '40px' }} />
                  <button type="button" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowPass(p => !p)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                {loading ? <span className="spinner" /> : <><Lock size={16} /> Sign In</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="John Doe" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="form-input" placeholder="johndoe" value={form.username} onChange={e => set('username', e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required />
              </div>
              <div className="info-box mb-4">
                🎁 You'll receive <strong>500 tokens</strong> and a wallet automatically on registration!
              </div>
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <span className="spinner" /> : 'Create Account'}
              </button>
            </form>
          )}

          <div className="divider" style={{ margin: '20px 0' }} />

          <div style={{ marginBottom: '10px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Quick Demo Access
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.email} className="btn btn-secondary btn-sm" onClick={() => quickLogin(acc)} disabled={loading} style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}>
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
