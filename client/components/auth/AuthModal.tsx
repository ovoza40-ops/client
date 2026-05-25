'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

export default function AuthModal({ open, onClose, defaultTab = 'signin' }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  if (!open) return null;

  const reset = () => {
    setError(''); setSuccess(''); setLoading(false);
  };

  const handleSubmit = async () => {
    reset();
    if (!email || !password) { setError("Email va parolni kiriting"); return; }
    if (tab === 'signup' && !fullName) { setError("Ismingizni kiriting"); return; }
    if (tab === 'signup' && !tosAccepted) { setError("Shartlarga rozilik bildirishingiz kerak"); return; }
    if (password.length < 6) { setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak"); return; }

    setLoading(true);
    if (tab === 'signin') {
      const { error } = await signIn(email, password);
      if (error) { setError(error); setLoading(false); return; }
      onClose();
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) { setError(error); setLoading(false); return; }
      setSuccess('Emailingizni tekshiring — tasdiqlash xati yuborildi!');
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal show">
      <div className="auth-backdrop" onClick={onClose} />
      <div className="auth-card" id="authBox">
        <div className="auth-head">
          <h2>LinguaBook PRO</h2>
          <p>
            {tab === 'signin'
              ? 'Akkauntingizga kiring va AI tarjimon bilan ishlang.'
              : 'Akkaunt yarating — bepul boshlang!'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'signin' ? 'active' : ''}`}
            onClick={() => { setTab('signin'); reset(); }}
          >
            Kirish
          </button>
          <button
            className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); reset(); }}
          >
            Ro&apos;yxatdan o&apos;tish
          </button>
        </div>

        {tab === 'signup' && (
          <input
            className="auth-input"
            placeholder="To'liq ismingiz"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}
        <input
          className="auth-input"
          type="email"
          placeholder="Email manzil"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="auth-input"
          type="password"
          placeholder="Parol (kamida 6 ta belgi)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />

        {tab === 'signup' && (
          <div className="auth-tos">
            <input
              type="checkbox"
              id="tosCheck"
              checked={tosAccepted}
              onChange={(e) => setTosAccepted(e.target.checked)}
            />
            <label htmlFor="tosCheck">
              Yuklangan va tarjima qilingan kitoblarning mualliflik huquqi bo'yicha
              to'liq javobgarlikni men o'z zimmamga olaman.
            </label>
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', color: 'var(--green)', fontSize: 13, padding: '8px 0' }}>
            ✅ {success}
          </div>
        ) : (
          <button
            className="auth-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '⏳ Kuting...' : tab === 'signin' ? 'Kirish' : "Akkaunt yaratish"}
          </button>
        )}

        {error && <div className="auth-error">⚠️ {error}</div>}

        <div className="auth-note">
          {tab === 'signin'
            ? "Akkauntingiz yo'qmi? Yuqoridagi \"Ro'yxatdan o'tish\" tugmasini bosing."
            : 'Bepul ro\'yxatdan o\'tib AI tarjimondan foydalaning.'}
        </div>
      </div>
    </div>
  );
}
