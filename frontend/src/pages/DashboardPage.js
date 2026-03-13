import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { walletAPI, txAPI, explorerAPI } from '../utils/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Wallet, ArrowLeftRight, Cpu, TrendingUp, RefreshCw, Zap, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(4) : p.value}</div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user, wallets } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [pending, setPending] = useState([]);
  const [mining, setMining] = useState(false);
  const [loading, setLoading] = useState(true);

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes, pendingRes] = await Promise.all([
        explorerAPI.getStats(),
        txAPI.getAnalytics(14),
        txAPI.getPending()
      ]);
      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
      setPending(pendingRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleMine = async () => {
    if (!wallets.length) { toast.error('No wallet found to receive mining reward'); return; }
    setMining(true);
    try {
      const res = await txAPI.mine(wallets[0].address);
      toast.success(`⛏️ Block mined! Reward: ${res.data.data.reward} tokens`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mining failed');
    } finally {
      setMining(false);
    }
  };

  const chartData = analytics?.chartData?.slice(-14) || [];

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>
            Welcome back, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted text-sm">Here's what's happening on the blockchain today</p>
        </div>
        <div className="flex gap-2">
          {pending.length > 0 && (
            <button className="btn btn-success" onClick={handleMine} disabled={mining}>
              {mining ? <span className="spinner" /> : <Cpu size={16} />}
              Mine {pending.length} Pending
            </button>
          )}
          <button className="btn btn-secondary btn-icon" onClick={loadData}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card" style={{ '--accent-color': 'var(--accent-primary)' }}>
          <div className="stat-label">Total Balance</div>
          <div className="stat-value">{totalBalance.toFixed(4)}</div>
          <div className="stat-sub">across {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</div>
          <Wallet size={48} className="stat-icon" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--accent-secondary)' }}>
          <div className="stat-label">Chain Blocks</div>
          <div className="stat-value">{stats?.chainLength || 0}</div>
          <div className="stat-sub">{stats?.isValid ? '✓ Chain valid' : '⚠ Invalid chain'}</div>
          <Shield size={48} className="stat-icon" style={{ color: 'var(--accent-secondary)' }} />
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--accent-warning)' }}>
          <div className="stat-label">Pending Txs</div>
          <div className="stat-value">{stats?.pendingTransactions || 0}</div>
          <div className="stat-sub">awaiting confirmation</div>
          <ArrowLeftRight size={48} className="stat-icon" style={{ color: 'var(--accent-warning)' }} />
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--accent-purple)' }}>
          <div className="stat-label">Network Volume</div>
          <div className="stat-value">{(stats?.totalTxVolume || 0).toFixed(2)}</div>
          <div className="stat-sub">{stats?.totalTransactions || 0} total transactions</div>
          <TrendingUp size={48} className="stat-icon" style={{ color: 'var(--accent-purple)' }} />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ gap: '16px', marginBottom: '20px' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Transaction Volume (14 days)</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4a5f74' }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#4a5f74' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="volume" stroke="#00d4ff" fill="url(#volGrad)" strokeWidth={2} name="Volume" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Daily Transactions</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4a5f74' }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#4a5f74' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#00ff88" radius={[4, 4, 0, 0]} name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2">
        {/* My Wallets */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">My Wallets</span>
            <a href="/wallets" style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none' }}>View all →</a>
          </div>
          {wallets.length === 0 ? (
            <div className="empty-state"><p>No wallets found</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {wallets.slice(0, 4).map(w => (
                <div key={w.address} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{w.name}</div>
                    <div className="address-mono">{w.address.slice(0, 20)}...</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{(w.balance || 0).toFixed(4)}</div>
                    <div className="text-muted text-sm">tokens</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Network Info */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Network Status</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent-secondary)' }}>
              <span className="status-dot online" /> Live
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Mining Difficulty', value: stats?.difficulty || 3, icon: '⚡' },
              { label: 'Mining Reward', value: `${stats?.miningReward || 50} tokens`, icon: '🏆' },
              { label: 'Smart Contracts', value: stats?.smartContracts || 0, icon: '📜' },
              { label: 'Hash Rate', value: `${(stats?.networkHashRate || 0).toLocaleString()} H/s`, icon: '🔢' },
              { label: 'Block Size', value: '10 tx/block', icon: '📦' },
              { label: 'Chain Integrity', value: stats?.isValid ? 'Valid ✓' : 'Error ✗', icon: '🔒' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.icon} {item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
