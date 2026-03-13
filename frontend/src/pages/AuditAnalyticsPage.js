import React, { useState, useEffect } from 'react';
import { txAPI } from '../utils/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { Download, RefreshCw } from 'lucide-react';

const COLORS = ['#00d4ff', '#00ff88', '#ffb800', '#a855f7', '#ff4466'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(4) : p.value}</div>)}
    </div>
  );
};

export function AuditPage() {
  const [log, setLog] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ type: '', page: 1 });
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => { loadLog(); }, [filters]);

  const loadLog = async () => {
    setLoading(true);
    try {
      const res = await txAPI.getAuditLog({ ...filters, limit: 30 });
      setLog(res.data.data.transactions || []);
      setSummary(res.data.data.summary);
      setPagination({ total: res.data.data.total, pages: res.data.data.pages });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load audit log');
    } finally { setLoading(false); }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Type', 'From', 'To', 'Amount', 'Fee', 'Status', 'Block', 'Timestamp'];
    const rows = log.map(tx => [tx.id, tx.type, tx.fromAddress || 'SYSTEM', tx.toAddress, tx.amount, tx.fee || 0, tx.status, tx.blockIndex ?? 'PENDING', new Date(tx.timestamp).toISOString()]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `audit_log_${Date.now()}.csv`; a.click();
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontSize: '22px', fontWeight: '800' }}>Audit Log</h1>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><Download size={14} /> Export CSV</button>
          <button className="btn btn-secondary btn-icon" onClick={loadLog}><RefreshCw size={14} /></button>
        </div>
      </div>

      {summary && (
        <div className="stat-grid" style={{ marginBottom: '20px' }}>
          {[
            { label: 'Total Transactions', value: summary.totalTransactions },
            { label: 'Total Volume', value: parseFloat(summary.totalVolume).toFixed(4) },
            { label: 'Total Fees Collected', value: parseFloat(summary.totalFees).toFixed(4) },
            ...Object.entries(summary.byType || {}).map(([type, count]) => ({ label: type, value: count })),
          ].slice(0, 6).map(s => (
            <div key={s.label} className="stat-card" style={{ '--accent-color': 'var(--accent-primary)' }}>
              <div className="stat-label" style={{ fontSize: '10px' }}>{s.label}</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="flex gap-2 items-center">
          <select className="form-select" style={{ width: '160px' }} value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value, page: 1 }))}>
            {['', 'TRANSFER', 'REWARD', 'CONTRACT_DEPLOY', 'CONTRACT_CALL'].map(t => <option key={t} value={t}>{t || 'All Types'}</option>)}
          </select>
          <span className="text-muted text-sm">{pagination.total} total entries</span>
        </div>
      </div>

      <div className="card">
        {loading ? <div style={{ textAlign: 'center', padding: '40px' }}><span className="spinner" /></div> : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>TX ID</th><th>Type</th><th>From</th><th>To</th><th>Amount</th><th>Fee</th><th>Block</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {log.length === 0 ? <tr><td colSpan={9}><div className="empty-state"><p>No audit records</p></div></td></tr> :
                  log.map(tx => (
                    <tr key={tx.id}>
                      <td><span className="address-mono" style={{ fontSize: '11px' }}>{tx.id.slice(0, 14)}...</span></td>
                      <td><span className={`badge ${tx.type === 'TRANSFER' ? 'badge-primary' : tx.type === 'REWARD' ? 'badge-success' : 'badge-purple'}`} style={{ fontSize: '10px' }}>{tx.type}</span></td>
                      <td className="address-mono">{(tx.fromAddress || 'SYSTEM').slice(0, 14)}...</td>
                      <td className="address-mono">{(tx.toAddress || '').slice(0, 14)}...</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{tx.amount?.toFixed(4)}</td>
                      <td className="text-muted text-mono text-sm">{(tx.fee || 0).toFixed(4)}</td>
                      <td className="text-mono text-sm">{tx.blockIndex ?? '—'}</td>
                      <td><span className={`badge ${tx.status === 'CONFIRMED' ? 'badge-success' : 'badge-warning'}`}>{tx.status}</span></td>
                      <td className="text-muted text-sm">{new Date(tx.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <span className="text-muted text-sm">Page {filters.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" disabled={filters.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>← Prev</button>
              <button className="btn btn-secondary btn-sm" disabled={filters.page >= pagination.pages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, [days]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await txAPI.getAnalytics(days);
      setData(res.data.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  const pieData = data?.summary?.networkStats ? Object.entries(data.summary.networkStats.byType || {}).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontSize: '22px', fontWeight: '800' }}>Analytics</h1>
        <div className="flex gap-2 items-center">
          <select className="form-select" style={{ width: '130px' }} value={days} onChange={e => setDays(Number(e.target.value))}>
            {[7, 14, 30, 60].map(d => <option key={d} value={d}>Last {d} days</option>)}
          </select>
          <button className="btn btn-secondary btn-icon" onClick={load}><RefreshCw size={14} /></button>
        </div>
      </div>

      {data?.summary && (
        <div className="stat-grid" style={{ marginBottom: '20px' }}>
          {[
            { label: 'Total Volume', value: data.summary.totalVolume.toFixed(4), color: 'var(--accent-primary)' },
            { label: 'Total Transactions', value: data.summary.totalTransactions, color: 'var(--accent-secondary)' },
            { label: 'Avg Tx / Day', value: data.summary.avgTxPerDay, color: 'var(--accent-warning)' },
            { label: 'Network Hash Rate', value: `${data.summary.networkStats?.networkHashRate || 0} H/s`, color: 'var(--accent-purple)' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ '--accent-color': s.color }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: '22px', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? <div style={{ textAlign: 'center', padding: '80px' }}><span className="spinner" /></div> : (
        <>
          <div className="grid-2" style={{ marginBottom: '20px' }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Transaction Volume</span></div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.chartData || []}>
                    <defs>
                      <linearGradient id="volG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4a5f74' }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: '#4a5f74' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="volume" stroke="#00d4ff" fill="url(#volG)" strokeWidth={2} name="Volume" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Daily Transaction Count</span></div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.chartData || []}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4a5f74' }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: '#4a5f74' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#00ff88" radius={[3, 3, 0, 0]} name="Transactions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header"><span className="card-title">Daily Fees Collected</span></div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.chartData || []}>
                    <defs>
                      <linearGradient id="feeG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffb800" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ffb800" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4a5f74' }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: '#4a5f74' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="fees" stroke="#ffb800" fill="url(#feeG)" strokeWidth={2} name="Fees" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Transaction Types Distribution</span></div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
