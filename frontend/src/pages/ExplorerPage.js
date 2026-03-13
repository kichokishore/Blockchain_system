import React, { useState, useEffect } from 'react';
import { explorerAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Search, RefreshCw, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ExplorerPage() {
  const [blocks, setBlocks] = useState([]);
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState(null);

  useEffect(() => { loadChain(); loadStats(); }, [page]);

  const loadChain = async () => {
    setLoading(true);
    try {
      const res = await explorerAPI.getChain({ page, limit: 10 });
      setBlocks(res.data.data.blocks);
      setTotalPages(res.data.data.pages);
    } catch { toast.error('Failed to load blockchain'); }
    finally { setLoading(false); }
  };

  const loadStats = async () => {
    try {
      const res = await explorerAPI.getStats();
      setStats(res.data.data);
    } catch {}
  };

  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    try {
      const res = await explorerAPI.search(searchQ.trim());
      setSearchResults(res.data.data);
    } catch { toast.error('Search failed'); }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const res = await explorerAPI.validate();
      setValidation(res.data.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Validation failed'); }
    finally { setValidating(false); }
  };

  const loadBlock = async (identifier) => {
    try {
      const res = await explorerAPI.getBlock(identifier);
      setSelected(res.data.data);
    } catch { toast.error('Block not found'); }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontSize: '22px', fontWeight: '800' }}>Block Explorer</h1>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={handleValidate} disabled={validating}>
            {validating ? <span className="spinner" /> : <Shield size={14} />} Validate Chain
          </button>
          <button className="btn btn-secondary btn-icon" onClick={() => { loadChain(); loadStats(); }}><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="stat-grid" style={{ marginBottom: '20px' }}>
          {[
            { label: 'Total Blocks', value: stats.chainLength, color: 'var(--accent-primary)' },
            { label: 'Total Transactions', value: stats.totalTransactions, color: 'var(--accent-secondary)' },
            { label: 'Pending', value: stats.pendingTransactions, color: 'var(--accent-warning)' },
            { label: 'Smart Contracts', value: stats.smartContracts, color: 'var(--accent-purple)' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ '--accent-color': s.color }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: '22px' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="form-label">Search — Block index, block hash, transaction ID, or address</div>
        <div className="flex gap-2">
          <input className="form-input mono" style={{ flex: 1 }} placeholder="Enter block #, hash, tx ID, or address..." value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          <button className="btn btn-primary" onClick={handleSearch}><Search size={16} /> Search</button>
        </div>

        {searchResults && (
          <div style={{ marginTop: '16px' }}>
            {searchResults.blocks.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div className="form-label" style={{ marginBottom: '6px' }}>Blocks</div>
                {searchResults.blocks.map(b => (
                  <div key={b.hash} className="card" style={{ padding: '10px', cursor: 'pointer', marginBottom: '6px' }} onClick={() => loadBlock(b.index)}>
                    <span className="badge badge-primary">Block #{b.index}</span>
                    <span className="address-mono" style={{ marginLeft: '10px' }}>{b.hash.slice(0, 32)}...</span>
                    <span className="text-muted text-sm" style={{ marginLeft: '10px' }}>{b.txCount} transactions</span>
                  </div>
                ))}
              </div>
            )}
            {searchResults.transactions.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div className="form-label" style={{ marginBottom: '6px' }}>Transactions</div>
                {searchResults.transactions.map(tx => (
                  <div key={tx.id} style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '6px' }}>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-primary">{tx.type}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{tx.amount} tokens</span>
                      <span className={`badge ${tx.status === 'CONFIRMED' ? 'badge-success' : 'badge-warning'}`}>{tx.status}</span>
                    </div>
                    <div className="address-mono" style={{ marginTop: '4px', fontSize: '11px' }}>{tx.id}</div>
                  </div>
                ))}
              </div>
            )}
            {searchResults.addresses.length > 0 && (
              <div>
                <div className="form-label" style={{ marginBottom: '6px' }}>Address</div>
                {searchResults.addresses.map(addr => (
                  <div key={addr.address} style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                    <div className="address-mono">{addr.address}</div>
                    <div className="flex gap-3" style={{ marginTop: '6px', fontSize: '13px' }}>
                      <span>Balance: <strong style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{addr.balance}</strong></span>
                      <span>Transactions: <strong>{addr.txCount}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!searchResults.blocks.length && !searchResults.transactions.length && !searchResults.addresses.length && (
              <div className="text-muted text-sm" style={{ marginTop: '10px' }}>No results found for "{searchQ}"</div>
            )}
          </div>
        )}
      </div>

      {/* Validation Result */}
      {validation && (
        <div className={`${validation.isValid ? 'info-box' : 'warning-box'}`} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {validation.isValid ? <CheckCircle size={18} color="var(--accent-secondary)" /> : <AlertTriangle size={18} />}
          <div>
            <strong>{validation.message}</strong>
            <div className="text-sm" style={{ marginTop: '2px' }}>Chain length: {validation.chainLength} | Checked: {new Date(validation.lastChecked).toLocaleTimeString()}</div>
          </div>
        </div>
      )}

      {/* Block List + Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
        <div>
          <div className="form-label" style={{ marginBottom: '10px' }}>Blockchain — Latest Blocks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? <div style={{ textAlign: 'center', padding: '40px' }}><span className="spinner" /></div> :
              blocks.map(b => (
                <div key={b.hash} className="card" style={{ padding: '12px', cursor: 'pointer', borderColor: selected?.index === b.index ? 'var(--accent-primary)' : 'var(--border)' }}
                  onClick={() => loadBlock(b.index)}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: b.index === 0 ? 'var(--accent-warning)' : 'var(--accent-primary)' }}>
                      #{b.index} {b.index === 0 ? '(Genesis)' : ''}
                    </span>
                    <span className="text-muted text-sm">{new Date(b.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="address-mono" style={{ fontSize: '11px', marginBottom: '6px' }}>{b.hash.slice(0, 40)}...</div>
                  <div className="flex gap-2" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>📦 {b.transactionCount} tx</span>
                    <span>⛏ {b.miner?.slice(0, 10)}...</span>
                    <span>{(b.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between" style={{ marginTop: '12px' }}>
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Newer</button>
              <span className="text-muted text-sm">Page {page}/{totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Older →</button>
            </div>
          )}
        </div>

        {/* Block Detail */}
        {selected ? (
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header">
                <span className="card-title">Block #{selected.index}</span>
                <span className="badge badge-success">{selected.confirmations} confirmations</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                {[
                  { label: 'Block Hash', value: selected.hash, mono: true },
                  { label: 'Previous Hash', value: selected.previousHash, mono: true },
                  { label: 'Merkle Root', value: selected.merkleRoot, mono: true },
                  { label: 'Miner', value: selected.miner, mono: true },
                  { label: 'Nonce', value: selected.nonce },
                  { label: 'Transactions', value: selected.transactions?.length },
                  { label: 'Size', value: `${(selected.size / 1024).toFixed(2)} KB` },
                  { label: 'Timestamp', value: new Date(selected.timestamp).toLocaleString() },
                ].map(item => (
                  <div key={item.label} style={{ padding: '8px', background: 'var(--bg-elevated)', borderRadius: '6px' }}>
                    <div className="text-muted text-sm" style={{ marginBottom: '2px' }}>{item.label}</div>
                    <div style={{ fontFamily: item.mono ? 'var(--font-mono)' : 'inherit', fontSize: '11px', wordBreak: 'break-all', fontWeight: '600' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Transactions ({selected.transactions?.length})</span></div>
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Type</th><th>Amount</th><th>From</th><th>To</th><th>Status</th></tr></thead>
                  <tbody>
                    {(selected.transactions || []).map(tx => (
                      <tr key={tx.id}>
                        <td><span className="badge badge-primary" style={{ fontSize: '10px' }}>{tx.type}</span></td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{tx.amount?.toFixed(4)}</td>
                        <td className="address-mono">{(tx.fromAddress || 'SYSTEM').slice(0, 16)}...</td>
                        <td className="address-mono">{(tx.toAddress || '').slice(0, 16)}...</td>
                        <td><span className="badge badge-success" style={{ fontSize: '10px' }}>{tx.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state card"><p>Click a block to view details</p></div>
        )}
      </div>
    </div>
  );
}
