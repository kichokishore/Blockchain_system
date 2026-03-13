import React, { useState, useEffect, useCallback } from 'react';
import { walletAPI, txAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Download, Upload, Eye, EyeOff, Copy, RefreshCw, Edit2, Send } from 'lucide-react';
import SendModal from '../components/wallet/SendModal';
import CreateWalletModal from '../components/wallet/CreateWalletModal';

export default function WalletsPage() {
  const { wallets, refreshWallets } = useAuth();
  const [walletsDetail, setWalletsDetail] = useState([]);
  const [selected, setSelected] = useState(null);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [exportPass, setExportPass] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const loadWallets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await walletAPI.getAll();
      setWalletsDetail(res.data.data);
      if (!selected && res.data.data.length > 0) {
        setSelected(res.data.data[0]);
      }
    } catch { toast.error('Failed to load wallets'); }
    finally { setLoading(false); }
  }, [selected]);

  useEffect(() => { loadWallets(); }, []);

  useEffect(() => {
    if (selected) loadTxs(selected.address);
  }, [selected]);

  const loadTxs = async (address) => {
    try {
      const res = await txAPI.getForAddress(address, { limit: 10 });
      setTxs(res.data.data.transactions || []);
    } catch {}
  };

  const handleExport = async () => {
    try {
      const res = await walletAPI.export(selected.address, exportPass);
      setExportData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getTxType = (tx, address) => {
    if (tx.fromAddress === address) return { label: 'Sent', color: 'var(--accent-danger)', sign: '-' };
    if (tx.toAddress === address) return { label: 'Received', color: 'var(--accent-secondary)', sign: '+' };
    return { label: tx.type, color: 'var(--text-muted)', sign: '' };
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontSize: '22px', fontWeight: '800' }}>Wallets</h1>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={loadWallets}><RefreshCw size={14} /></button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}><Plus size={14} /> New Wallet</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        {/* Wallet List */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {walletsDetail.map(w => (
              <div
                key={w.address}
                className="card"
                onClick={() => setSelected(w)}
                style={{
                  cursor: 'pointer', padding: '14px',
                  borderColor: selected?.address === w.address ? 'var(--accent-primary)' : 'var(--border)',
                  background: selected?.address === w.address ? 'rgba(0,212,255,0.05)' : 'var(--bg-card)'
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>{w.name}</span>
                  <span className={`badge ${w.type === 'HD_WALLET' ? 'badge-primary' : 'badge-purple'}`} style={{ fontSize: '10px' }}>{w.type}</span>
                </div>
                <div className="address-mono" style={{ marginBottom: '8px' }}>{w.address.slice(0, 24)}...</div>
                <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                  {(w.balance || 0).toFixed(4)}
                </div>
                <div className="text-muted text-sm">tokens available</div>
                {w.pendingCount > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--accent-warning)' }}>
                    ⏳ {w.pendingCount} pending transaction{w.pendingCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
            {walletsDetail.length === 0 && !loading && (
              <div className="empty-state"><p>No wallets yet. Create one!</p></div>
            )}
          </div>
        </div>

        {/* Wallet Detail */}
        {selected ? (
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{selected.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="address-mono" style={{ fontSize: '13px' }}>{selected.address}</span>
                    <button className="btn btn-icon" style={{ width: '24px', height: '24px' }} onClick={() => copy(selected.address)}>
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm" onClick={() => setShowSend(true)}>
                    <Send size={14} /> Send
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowExport(true)}>
                    <Download size={14} /> Export
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Balance', value: `${(selected.balance || 0).toFixed(4)}`, color: 'var(--accent-primary)' },
                  { label: 'Total Transactions', value: selected.stats?.totalTransactions || 0 },
                  { label: 'Total Sent', value: `${(selected.stats?.totalSent || 0).toFixed(4)}` },
                  { label: 'Total Received', value: `${(selected.stats?.totalReceived || 0).toFixed(4)}` },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border)' }}>
                    <div className="stat-label" style={{ fontSize: '10px', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: s.color || 'var(--text-primary)' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction History */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Recent Transactions</span>
                <a href={`/transactions?address=${selected.address}`} style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none' }}>View all →</a>
              </div>
              {txs.length === 0 ? (
                <div className="empty-state"><p>No transactions yet</p></div>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr><th>Type</th><th>Amount</th><th>Address</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {txs.map(tx => {
                        const info = getTxType(tx, selected.address);
                        return (
                          <tr key={tx.id}>
                            <td><span className="badge badge-primary" style={{ fontSize: '10px' }}>{info.label}</span></td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: info.color }}>
                              {info.sign}{tx.amount?.toFixed(4)}
                            </td>
                            <td><span className="address-mono">{(info.sign === '-' ? tx.toAddress : tx.fromAddress || 'SYSTEM')?.slice(0, 20)}...</span></td>
                            <td><span className={`badge ${tx.status === 'CONFIRMED' ? 'badge-success' : 'badge-warning'}`}>{tx.status}</span></td>
                            <td className="text-muted text-sm">{new Date(tx.timestamp).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state card"><p>Select a wallet to view details</p></div>
        )}
      </div>

      {/* Modals */}
      {showSend && selected && (
        <SendModal wallet={selected} onClose={() => { setShowSend(false); loadWallets(); }} />
      )}
      {showCreate && (
        <CreateWalletModal onClose={() => { setShowCreate(false); loadWallets(); refreshWallets(); }} />
      )}

      {/* Export Modal */}
      {showExport && selected && (
        <div className="modal-overlay" onClick={() => { setShowExport(false); setExportData(null); setExportPass(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Export Wallet</span>
              <button className="btn btn-icon" onClick={() => { setShowExport(false); setExportData(null); setExportPass(''); }}>&times;</button>
            </div>
            {!exportData ? (
              <>
                <div className="warning-box mb-4">⚠️ Keep your mnemonic phrase safe. Anyone with it can access your funds.</div>
                <div className="form-group">
                  <label className="form-label">Wallet Password</label>
                  <input className="form-input" type="password" placeholder="Enter your wallet password" value={exportPass} onChange={e => setExportPass(e.target.value)} />
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowExport(false)}>Cancel</button>
                  <button className="btn btn-danger" onClick={handleExport} disabled={!exportPass}>Export Mnemonic</button>
                </div>
              </>
            ) : (
              <>
                <div className="info-box mb-4">✅ Wallet exported. Store this phrase securely — offline preferred.</div>
                <div className="form-group">
                  <label className="form-label">Recovery Phrase (12 words)</label>
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-bright)', borderRadius: '8px', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {exportData.mnemonic?.split(' ').map((word, i) => (
                      <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                        <span className="text-muted" style={{ marginRight: '6px', fontSize: '11px' }}>{i + 1}.</span>{word}
                      </div>
                    ))}
                  </div>
                </div>
                <button className="btn btn-secondary w-full" onClick={() => copy(exportData.mnemonic)} style={{ justifyContent: 'center' }}>
                  <Copy size={14} /> Copy Phrase
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
