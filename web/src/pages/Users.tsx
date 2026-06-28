import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type User } from '../api/client';
import { useAuth } from '../store/auth';
import { RoleBadge } from '../components/Badges';

const COUNTRIES = ['JP', 'KR', 'TW', 'DE', 'FR', 'IT', 'US', 'MX', 'CA', 'CN'];

export function Users() {
  const { t } = useTranslation();
  const { capabilities } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [show, setShow] = useState(false);

  const load = useCallback(() => {
    api.get('/users').then((r) => setUsers(r.data.users)).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="section-title">
        <h2>{t('users.title')} <span className="muted">({users.length})</span></h2>
        <button className="btn" onClick={() => setShow(true)}>+ {t('users.add')}</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('common.name')}</th>
                <th>{t('form.username')}</th>
                <th>{t('form.role')}</th>
                <th>{t('common.country')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td className="muted">@{u.username}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>{u.country ? t(`country.${u.country}`, u.country) : '—'}</td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 24 }}>{t('users.empty')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {show && (
        <UserFormModal
          canCreateDealer={!!capabilities.viewAllDealers}
          dealers={users.filter((u) => u.role === 'dealer')}
          onClose={() => setShow(false)}
          onSaved={() => { setShow(false); load(); }}
        />
      )}
    </div>
  );
}

function UserFormModal({
  onClose, onSaved, canCreateDealer, dealers
}: { onClose: () => void; onSaved: () => void; canCreateDealer: boolean; dealers: User[] }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [country, setCountry] = useState('JP');
  const [dealerId, setDealerId] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api.post('/users', {
        username, password, name, role, country,
        dealer_id: role === 'user' && dealerId ? dealerId : undefined
      });
      onSaved();
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <div className="section-title"><h3>{t('users.create')}</h3></div>
        <form className="form-grid" onSubmit={save}>
          <label className="field">{t('form.name')}
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="field">{t('form.username')}
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label className="field">{t('form.password')}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {canCreateDealer && (
            <label className="field">{t('form.role')}
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="user">{t('role.user')}</option>
                <option value="dealer">{t('role.dealer')}</option>
              </select>
            </label>
          )}
          {canCreateDealer && role === 'user' && (
            <label className="field">{t('form.dealer')}
              <select value={dealerId} onChange={(e) => setDealerId(e.target.value)}>
                <option value="">—</option>
                {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
          )}
          <label className="field">{t('form.country')}
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{t(`country.${c}`, c)}</option>)}
            </select>
          </label>
          {err && <div className="error-text">{err}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn ghost" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn" disabled={busy}>{t('common.create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
