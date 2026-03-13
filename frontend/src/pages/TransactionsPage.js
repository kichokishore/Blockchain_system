import React, { useState, useEffect } from 'react';
import { txAPI, walletAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Cpu, RefreshCw, Filter, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react';
import SendModal from '../components/wallet/SendModal';

const TX_TYPES = ['', 'TRANSFER', 'REWARD', 'CONTRACT_DEPLOY', 'CONTRACT_CALL'];
const TX_STATUSES = ['', 'CONFIRMED', 'PENDING'];

export default function TransactionsPage() {
  const { wallets } = useAuth();
  const [txs, setTxs] = useState([]);
  const [pending, setPending] = useState([]);
  const [walletDetails, setWalletDetails] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [filters, setFilters] = useState({ type: '', status: '', page: 1 });
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [mining, setMining] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchId, setSearchId] = useState('');
  const [foundTx, setFoundTx] = useState(null);

  useEffect(() => {
    walletAPI.getAll().then(res => {
      setWalletDetails(res.data.data);
      if (res.data.data.length > 0) setSelectedWallet(res.data.data[0].address);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadTxs();
    loadPending();
  }, [selectedWallet, filters]);

  const loadTxs = async () => {
    if (!selectedWallet) return;
    setLoading(true);
    try {
      const res = await txAPI.getForAddress(selectedWallet, { ...filters, limit: 20 });
      setTxs(res.data.data.transactions || []);
      setPagination({ total: res.data.data.total, pages: res.data.data.pages });
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  };

  const loadPending = async () => {
    try {
      const res = await txAPI.getPending();
      setPending(res.data.data || []);
    } catch {}
  };

  const handleMine = async () => {
    if (!walletDetails.length) return;
    setMining(true);
    try {
      const res = await txAPI.mine(walletDetails[0].address);
      toast.success(`⛏️ Block #${res.data.data.blockIndex} mined! Reward: ${res.data.data.reward} tokens`);
      loadTxs(); loadPending();
    } catch (err) { toast.error(err.response?.data?.message || 'Mining failed'); }
    finally { setMining(false); }
  };

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    try {
      const res = await txAPI.getById(searchId.trim());
      setFoundTx(res.data.data);
    } catch { toast.error('Transaction not found'); setFoundTx(null); }
  };

  const selectedWalletObj = walletDetails.find(w => w.address === selectedWallet);

  const getTxDirection = (tx) => {
    if (!selectedWallet) return 'neutral';
    if (tx.fromAddress === selectedWallet) return 'out';
    if (tx.toAddress === selectedWallet) return 'in';
    return 'neutral';
  };

  const typeColors = { TRANSFER: 'badge-primary', REWARD: 'badge-success', CONTRACT_DEPLOY: 'badge-purple', CONTRACT_CALL: 'badge-warning' };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontSize: '22px', fontWeight: '800' }}>Transactions</h1>
        <div className="flex gap-2">
          {pending.length > 0 && (
            <button className="btn btn-success btn-sm" onClick={handleMine} disabled={mining}>
              {mining ? <span className="spinner" /> : <Cpu size={14} />}
              Mine ({pending.length})
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowSend(true)} disabled={!selectedWalletObj}>
            Send Tokens
          </button>
          <button className="btn btn-secondary btn-icon" onClick={() => { loadTxs(); loadPending(); }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Wallet Selector */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 200px' }}>
            <label className="form-label">Wallet</label>
            <select className="form-select" value={selectedWallet} onChange={e => setSelectedWallet(e.target.value)}>
              {walletDetails.map(w => <option key={w.address} value={w.address}>{w.name} — {w.balance?.toFixed(4)} tokens</option>)}
            </select>
          </div>
          <div style={{ flex: '0 0 140px' }}>
            <label className="form-label">Type</label>
            <select className="form-select" value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value, page: 1 }))}>
              {TX_TYPES.map(t => <option key={t} value={t}>{t || 'All Types'}</option>)}
            </select>
          </div>
          <div style={{ flex: '0 0 140px' }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value, page: 1 }))}>
              {TX_STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label className="form-label">Search by TX ID</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="form-input mono" placeholder="Transaction ID..." value={searchId} onChange={e => setSearchId(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              <button className="btn btn-secondary btn-sm" onClick={handleSearch}><Search size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Found TX */}
      {foundTx && (
        <div className="card" style={{ marginBottom: '16px', borderColor: 'var(--accent-primary)' }}>
          <div className="card-header">
            <span className="card-title">Found Transaction</span>
            <button className="btn btn-icon" onClick={() => setFoundTx(null)}>&times;</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'TX ID', value: foundTx.id, mono: true },
              { label: 'Amount', value: `${foundTx.amount} tokens` },
              { label: 'Status', value: foundTx.status },
              { label: 'Block', value: foundTx.blockIndex !== null ? `#${foundTx.blockIndex}` : 'Pending' },
              { label: 'Confirmations', value: foundTx.confirmations || 0 },
              { label: 'Date', value: new Date(foundTx.timestamp).toLocaleString() },
            ].map(item => (
              <div key={item.label} style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                <div className="text-muted text-sm">{item.label}</div>
                <div style={{ fontFamily: item.mono ? 'var(--font-mono)' : 'inherit', fontSize: '13px', fontWeight: '600', wordBreak: 'break-all' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-nav">
        <div className={`tab-item ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          All ({pagination.total})
        </div>
        <div className={`tab-item ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          Pending ({pending.length})
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><span className="spinner" /></div>
        ) : (
          <>
            {activeTab === 'all' ? (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>Direction</th><th>Amount</th><th>Fee</th><th>Type</th><th>From / To</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {txs.length === 0 ? (
                      <tr><td colSpan={7} className="empty-state"><p>No transactions found</p></td></tr>
                    ) : txs.map(tx => {
                      const dir = getTxDirection(tx);
                      return (
                        <tr key={tx.id}>
                          <td>
                            {dir === 'out' ? <ArrowUpRight size={16} color="var(--accent-danger)" /> :
                              dir === 'in' ? <ArrowDownLeft size={16} color="var(--accent-secondary)" /> :
                                <span className="text-muted">—</span>}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: dir === 'out' ? 'var(--accent-danger)' : dir === 'in' ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>
                            {dir === 'out' ? '-' : dir === 'in' ? '+' : ''}{tx.amount?.toFixed(4)}
                          </td>
                          <td className="text-muted text-mono text-sm">{(tx.fee || 0).toFixed(4)}</td>
                          <td><span className={`badge ${typeColors[tx.type] || 'badge-primary'}`} style={{ fontSize: '10px' }}>{tx.type}</span></td>
                          <td>
                            <div className="address-mono">
                              {dir === 'out' ? `→ ${(tx.toAddress || '').slice(0, 18)}...` : `← ${(tx.fromAddress || 'SYSTEM').slice(0, 18)}...`}
                            </div>
                            {tx.data?.memo && <div className="text-muted text-sm">📝 {tx.data.memo}</div>}
                          </td>
                          <td><span className={`badge ${tx.status === 'CONFIRMED' ? 'badge-success' : 'badge-warning'}`}>{tx.status}</span></td>
                          <td className="text-muted text-sm">{new Date(tx.timestamp).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Amount</th><th>Type</th><th>From</th><th>To</th><th>Fee</th><th>Time</th></tr></thead>
                  <tbody>
                    {pending.length === 0 ? (
                      <tr><td colSpan={6} className="empty-state"><p>No pending transactions</p></td></tr>
                    ) : pending.map(tx => (
                      <tr key={tx.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{tx.amount?.toFixed(4)}</td>
                        <td><span className={`badge ${typeColors[tx.type] || 'badge-primary'}`} style={{ fontSize: '10px' }}>{tx.type}</span></td>
                        <td className="address-mono">{(tx.fromAddress || 'SYSTEM').slice(0, 18)}...</td>
                        <td className="address-mono">{(tx.toAddress || '').slice(0, 18)}...</td>
                        <td className="text-muted text-mono text-sm">{(tx.fee || 0).toFixed(4)}</td>
                        <td className="text-muted text-sm">{new Date(tx.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && activeTab === 'all' && (
              <div className="flex items-center justify-between" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <span className="text-muted text-sm">Page {filters.page} of {pagination.pages} ({pagination.total} total)</span>
                <div className="flex gap-2">
                  <button className="btn btn-secondary btn-sm" disabled={filters.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>← Prev</button>
                  <button className="btn btn-secondary btn-sm" disabled={filters.page >= pagination.pages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showSend && selectedWalletObj && (
        <SendModal wallet={selectedWalletObj} onClose={() => { setShowSend(false); loadTxs(); loadPending(); }} />
      )}
    </div>
  );
}
