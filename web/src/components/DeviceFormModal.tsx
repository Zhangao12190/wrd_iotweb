import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type User } from '../api/client';
import { useAuth } from '../store/auth';

const TYPES = ['plasma_cutter', 'welder', 'water_tank', 'gas_control_box'];
const COUNTRIES = ['JP', 'KR', 'TW', 'DE', 'FR', 'IT', 'US', 'MX', 'CA', 'CN'];

export function DeviceFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const { capabilities } = useAuth();
  const [serial, setSerial] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState(TYPES[0]);
  const [country, setCountry] = useState('JP');
  const [firmware, setFirmware] = useState('1.0.0');
  const [dealerId, setDealerId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [dealers, setDealers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (capabilities.manageUsers) {
      api.get('/users').then((r) => {
        const all: User[] = r.data.users;
        setDealers(all.filter((u) => u.role === 'dealer'));
        setUsers(all.filter((u) => u.role === 'user'));
      }).catch(() => {});
    }
  }, [capabilities.manageUsers]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api.post('/devices', {
        serial, name, type, country, firmware,
        dealer_id: dealerId || undefined,
        owner_user_id: ownerId || undefined
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
        <div className="section-title"><h3>{t('devices.add')}</h3></div>
        <form className="form-grid" onSubmit={save}>
          <label className="field">{t('form.serial')}
            <input value={serial} onChange={(e) => setSerial(e.target.value)} required />
          </label>
          <label className="field">{t('form.name')}
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="field">{t('form.type')}
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((tp) => <option key={tp} value={tp}>{t(`deviceType.${tp}`)}</option>)}
            </select>
          </label>
          <label className="field">{t('form.country')}
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{t(`country.${c}`, c)}</option>)}
            </select>
          </label>
          {capabilities.viewAllDealers && (
            <label className="field">{t('form.dealer')}
              <select value={dealerId} onChange={(e) => setDealerId(e.target.value)}>
                <option value="">—</option>
                {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
          )}
          {capabilities.manageUsers && (
            <label className="field">{t('form.owner')}
              <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
                <option value="">—</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>)}
              </select>
            </label>
          )}
          <label className="field">{t('form.firmware')}
            <input value={firmware} onChange={(e) => setFirmware(e.target.value)} />
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
