import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/auth';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    setBusy(true);
    try {
      await login(username, password);
      nav('/');
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="logo-big">W</div>
          <LanguageSwitcher />
        </div>
        <h2>{t('login.title')}</h2>
        <p className="muted" style={{ marginTop: 0 }}>{t('login.subtitle')}</p>
        <form onSubmit={submit} className="form-grid" style={{ marginTop: 8 }}>
          <label className="field">
            {t('login.username')}
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </label>
          <label className="field">
            {t('login.password')}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          {error && <div className="error-text">{t('login.error')}</div>}
          <button className="btn" disabled={busy} type="submit">
            {busy ? '…' : t('login.submit')}
          </button>
        </form>
        <div className="demo">
          <strong>{t('login.demo')}:</strong>
          <div>admin / admin123 — {t('role.admin')}</div>
          <div>dealer_jp / dealer123 — {t('role.dealer')}</div>
          <div>user1 / user123 — {t('role.user')}</div>
        </div>
      </div>
    </div>
  );
}
