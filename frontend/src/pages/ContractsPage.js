import React, { useState, useEffect } from 'react';
import { contractAPI, walletAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Play, Code, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

const SAMPLE_CONTRACT = `contract TokenVault {
  mapping(address => uint256) balances;
  uint256 treasury;

  function transfer(address to, uint256 amount) public returns (bool) {
    require(balances[msg.sender] >= amount, "Insufficient balance");
    balances[msg.sender] -= amount;
    balances[to] += amount;
    return true;
  }

  function getBalance(address account) public view returns (uint256) {
    return balances[account];
  }

  function addFunds() public payable {
    treasury += msg.value;
  }

  function store(string key, string value) public {
    storage[key] = value;
  }

  function retrieve(string key) public view returns (string) {
    return storage[key];
  }
}`;

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [callResult, setCallResult] = useState(null);
  const [expanded, setExpanded] = useState({});

  const [deployForm, setDeployForm] = useState({ ownerAddress: '', contractName: '', contractCode: SAMPLE_CONTRACT });
  const [callForm, setCallForm] = useState({ callerAddress: '', method: '', params: '', value: 0 });

  useEffect(() => {
    loadContracts();
    walletAPI.getAll().then(r => { setWallets(r.data.data); if (r.data.data.length > 0) { setDeployForm(p => ({ ...p, ownerAddress: r.data.data[0].address })); setCallForm(p => ({ ...p, callerAddress: r.data.data[0].address })); } });
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const res = await contractAPI.getAll();
      setContracts(res.data.data);
    } catch { toast.error('Failed to load contracts'); }
    finally { setLoading(false); }
  };

  const handleDeploy = async () => {
    try {
      const res = await contractAPI.deploy(deployForm);
      toast.success(`Contract "${deployForm.contractName}" deployed!`);
      setShowDeploy(false);
      loadContracts();
    } catch (err) { toast.error(err.response?.data?.message || 'Deploy failed'); }
  };

  const handleCall = async () => {
    if (!selected) return;
    try {
      let params = [];
      try { params = JSON.parse(`[${callForm.params}]`); } catch { params = callForm.params ? [callForm.params] : []; }
      const res = await contractAPI.call(selected.id, { callerAddress: callForm.callerAddress, method: callForm.method, params, value: parseFloat(callForm.value) || 0 });
      setCallResult(res.data.data);
      toast.success('Method executed successfully!');
      loadContracts();
    } catch (err) { toast.error(err.response?.data?.message || 'Call failed'); }
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontSize: '22px', fontWeight: '800' }}>Smart Contracts</h1>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={loadContracts}><RefreshCw size={14} /></button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowDeploy(true)}><Plus size={14} /> Deploy Contract</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
        {/* Contract List */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {contracts.map(c => (
              <div key={c.id} className="card" style={{ padding: '14px', cursor: 'pointer', borderColor: selected?.id === c.id ? 'var(--accent-primary)' : 'var(--border)', background: selected?.id === c.id ? 'rgba(0,212,255,0.05)' : 'var(--bg-card)' }}
                onClick={() => setSelected(c)}>
                <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                  <span style={{ fontWeight: '700', fontSize: '14px' }}>{c.name}</span>
                  <span className="badge badge-purple" style={{ fontSize: '10px' }}>CONTRACT</span>
                </div>
                <div className="address-mono" style={{ fontSize: '11px', marginBottom: '6px' }}>{c.id}</div>
                <div className="flex gap-2" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>📋 {c.abi?.length || 0} functions</span>
                  <span>⚡ {c.transactionCount || 0} calls</span>
                </div>
              </div>
            ))}
            {contracts.length === 0 && !loading && <div className="empty-state"><p>No contracts deployed yet</p></div>}
          </div>
        </div>

        {/* Contract Detail */}
        {selected ? (
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header">
                <span className="card-title">Contract: {selected.name}</span>
                <button className="btn btn-primary btn-sm" onClick={() => setShowCall(true)}><Play size={14} /> Call Method</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div className="form-label">Contract ID</div>
                  <div className="hash-display">{selected.id}</div>
                </div>
                <div>
                  <div className="form-label">Owner</div>
                  <div className="hash-display">{selected.owner?.slice(0, 40)}...</div>
                </div>
              </div>

              {/* ABI */}
              <div className="form-label" style={{ marginBottom: '8px' }}>ABI — Functions ({selected.abi?.length || 0})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(selected.abi || []).map((fn, i) => (
                  <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Code size={14} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                      <span style={{ color: 'var(--accent-primary)' }}>function</span>{' '}
                      <span style={{ color: 'var(--accent-secondary)' }}>{fn.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>({fn.inputs?.map(p => p.type).join(', ')})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* State */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Contract State</span>
              </div>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', overflow: 'auto', maxHeight: '200px', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(selected.state, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="empty-state card"><p>Select a contract to interact</p></div>
        )}
      </div>

      {/* Deploy Modal */}
      {showDeploy && (
        <div className="modal-overlay" onClick={() => setShowDeploy(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🚀 Deploy Smart Contract</span>
              <button className="btn btn-icon" onClick={() => setShowDeploy(false)}>&times;</button>
            </div>
            <div className="form-group">
              <label className="form-label">Owner Wallet</label>
              <select className="form-select" value={deployForm.ownerAddress} onChange={e => setDeployForm(p => ({ ...p, ownerAddress: e.target.value }))}>
                {wallets.map(w => <option key={w.address} value={w.address}>{w.name} — {w.address.slice(0, 20)}...</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Contract Name</label>
              <input className="form-input" placeholder="TokenVault" value={deployForm.contractName} onChange={e => setDeployForm(p => ({ ...p, contractName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Contract Code (Solidity-style)</label>
              <textarea className="form-textarea" style={{ minHeight: '220px' }} value={deployForm.contractCode} onChange={e => setDeployForm(p => ({ ...p, contractCode: e.target.value }))} />
            </div>
            <div className="info-box">The system will parse your contract's function signatures to generate an ABI automatically.</div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeploy(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleDeploy} disabled={!deployForm.contractName || !deployForm.contractCode}>Deploy Contract</button>
            </div>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {showCall && selected && (
        <div className="modal-overlay" onClick={() => { setShowCall(false); setCallResult(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">⚡ Call: {selected.name}</span>
              <button className="btn btn-icon" onClick={() => { setShowCall(false); setCallResult(null); }}>&times;</button>
            </div>
            <div className="form-group">
              <label className="form-label">Caller Address</label>
              <select className="form-select" value={callForm.callerAddress} onChange={e => setCallForm(p => ({ ...p, callerAddress: e.target.value }))}>
                {wallets.map(w => <option key={w.address} value={w.address}>{w.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Method Name</label>
              <select className="form-select" value={callForm.method} onChange={e => setCallForm(p => ({ ...p, method: e.target.value }))}>
                <option value="">Select method...</option>
                {(selected.abi || []).map(fn => <option key={fn.name} value={fn.name}>{fn.name}({fn.inputs?.map(p => p.type).join(', ')})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Parameters (comma-separated, JSON values)</label>
              <input className="form-input mono" placeholder={`e.g. "0xAddress", 100`} value={callForm.params} onChange={e => setCallForm(p => ({ ...p, params: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Value (tokens to send)</label>
              <input className="form-input" type="number" min="0" value={callForm.value} onChange={e => setCallForm(p => ({ ...p, value: e.target.value }))} />
            </div>
            {callResult && (
              <div style={{ marginBottom: '16px' }}>
                <div className="form-label">Result</div>
                <pre style={{ background: 'var(--bg-surface)', borderRadius: '8px', padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-secondary)', overflow: 'auto' }}>
                  {JSON.stringify(callResult.result, null, 2)}
                </pre>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowCall(false); setCallResult(null); }}>Close</button>
              <button className="btn btn-primary" onClick={handleCall} disabled={!callForm.method}><Play size={14} /> Execute</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
