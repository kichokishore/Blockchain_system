import React, { useState } from 'react';
import { txAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { Send, AlertTriangle } from 'lucide-react';

export default function SendModal({ wallet, onClose }) {
  const [form, setForm] = useState({ toAddress: '', amount: '', fee: '0.001', password: '', memo: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=form, 2=confirm, 3=success
  const [txResult, setTxResult] = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const totalCost = (parseFloat(form.amount) || 0) + (parseFloat(form.fee) || 0);
  const hasEnough = wallet.balance >= totalCost;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await txAPI.create({
        fromAddress: wallet.address,
        toAddress: form.toAddress,
        amount: parseFloat(form.amount),
        fee: parseFloat(form.fee),
        password: form.password,
        memo: form.memo || undefined
      });
      setTxResult(res.data.data);
      setStep(3);
      toast.success('Transaction submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            {step === 1 ? '💸 Send Tokens' : step === 2 ? '✅ Confirm Transaction' : '🎉 Transaction Submitted'}
          </span>
          <button className="btn btn-icon" onClick={onClose}>&times;</button>
        </div>

        {step === 1 && (
          <>
            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div className="text-muted text-sm">From</div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{wallet.name}</div>
              <div className="address-mono" style={{ fontSize: '11px' }}>{wallet.address}</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: '700', marginTop: '4px' }}>
                Balance: {wallet.balance?.toFixed(4)} tokens
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Recipient Address</label>
              <input className="form-input mono" placeholder="BC1..." value={form.toAddress} onChange={e => set('toAddress', e.target.value)} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input className="form-input" type="number" min="0.0001" step="0.0001" placeholder="0.0000" value={form.amount} onChange={e => set('amount', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Network Fee</label>
                <input className="form-input" type="number" min="0" step="0.0001" value={form.fee} onChange={e => set('fee', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Memo (optional)</label>
              <input className="form-input" placeholder="Optional transaction note..." value={form.memo} onChange={e => set('memo', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Wallet Password</label>
              <input className="form-input" type="password" placeholder="Enter wallet password to sign" value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            {form.amount && !hasEnough && (
              <div className="warning-box mb-4">
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Insufficient balance. Total required: {totalCost.toFixed(4)} tokens
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => setStep(2)}
                disabled={!form.toAddress || !form.amount || !form.password || !hasEnough}
              >
                Review <Send size={14} />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="info-box mb-4">Please review your transaction carefully before confirming.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'From', value: wallet.address.slice(0, 30) + '...' },
                { label: 'To', value: form.toAddress.slice(0, 30) + '...' },
                { label: 'Amount', value: `${parseFloat(form.amount).toFixed(4)} tokens` },
                { label: 'Network Fee', value: `${parseFloat(form.fee).toFixed(4)} tokens` },
                { label: 'Total', value: `${totalCost.toFixed(4)} tokens` },
                ...(form.memo ? [{ label: 'Memo', value: form.memo }] : []),
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                  <span className="text-muted text-sm">{item.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? <span className="spinner" /> : <><Send size={14} /> Confirm Send</>}
              </button>
            </div>
          </>
        )}

        {step === 3 && txResult && (
          <>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Transaction Submitted!</h3>
              <p className="text-muted text-sm">Your transaction is pending confirmation on the blockchain.</p>
            </div>
            <div className="form-group">
              <label className="form-label">Transaction ID</label>
              <div className="hash-display">{txResult.id}</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              {[
                { label: 'Amount', value: `${txResult.amount?.toFixed(4)} tokens` },
                { label: 'Status', value: txResult.status },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
                  <div className="text-muted text-sm">{item.label}</div>
                  <div style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
