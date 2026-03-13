import React, { useState } from 'react';
import { walletAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { Copy } from 'lucide-react';

export default function CreateWalletModal({ onClose }) {
  const [step, setStep] = useState(1); // 1=form, 2=mnemonic
  const [form, setForm] = useState({ walletName: '', password: '', confirmPassword: '' });
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await walletAPI.create(form.walletName, form.password);
      setWallet(res.data.data);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  return (
    <div className="modal-overlay" onClick={step === 2 ? undefined : onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{step === 1 ? '🔐 Create New Wallet' : '📋 Save Your Recovery Phrase'}</span>
          {step === 1 && <button className="btn btn-icon" onClick={onClose}>&times;</button>}
        </div>

        {step === 1 && (
          <>
            <div className="form-group">
              <label className="form-label">Wallet Name</label>
              <input className="form-input" placeholder="My Main Wallet" value={form.walletName} onChange={e => set('walletName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Wallet Password</label>
              <input className="form-input" type="password" placeholder="Strong password to encrypt your wallet" value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
            </div>
            <div className="info-box mb-4">
              🔑 Your wallet password encrypts your private key. It cannot be recovered if lost.
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={loading || !form.walletName || !form.password}>
                {loading ? <span className="spinner" /> : 'Create Wallet'}
              </button>
            </div>
          </>
        )}

        {step === 2 && wallet && (
          <>
            <div className="warning-box mb-4">
              ⚠️ <strong>CRITICAL:</strong> Write down your 12-word recovery phrase and store it safely. This is shown ONLY ONCE and cannot be recovered.
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-bright)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {wallet.mnemonic?.split(' ').map((word, i) => (
                  <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: '6px', padding: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', minWidth: '16px', fontFamily: 'var(--font-mono)' }}>{i + 1}.</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: '600' }}>{word}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => copy(wallet.mnemonic)} style={{ marginBottom: '16px' }}>
              <Copy size={12} /> Copy Phrase
            </button>
            <div className="form-group">
              <label className="form-label">Wallet Address</label>
              <div className="hash-display">{wallet.address}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
              <input type="checkbox" id="confirmed" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              <label htmlFor="confirmed" style={{ fontSize: '13px', cursor: 'pointer' }}>
                I have saved my recovery phrase in a safe place
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={onClose} disabled={!confirmed} style={{ justifyContent: 'center' }}>
                Done — I've saved my phrase
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
