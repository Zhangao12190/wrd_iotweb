import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api, type Device } from '../api/client';
import { useAuth } from '../store/auth';
import { useRealtime } from '../hooks/useRealtime';
import { StatusBadge, AlarmBadge } from '../components/Badges';
import { DeviceFormModal } from '../components/DeviceFormModal';

const TYPES = ['plasma_cutter', 'welder', 'water_tank', 'gas_control_box'];

export function Devices() {
  const { t } = useTranslation();
  const { capabilities } = useAuth();
  const nav = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(() => {
    api.get('/devices').then((r) => setDevices(r.data.devices));
  }, []);

  useEffect(() => { load(); }, [load]);

  // live status & alarm updates
  useRealtime(
    useCallback((msg: any) => {
      if (msg.type === 'status') {
        setDevices((prev) =>
          prev.map((d) => (d.id === msg.deviceId ? { ...d, status: msg.status, alarm: msg.alarm, last_seen: msg.last_seen } : d))
        );
      }
    }, [])
  );

  const countries = useMemo(
    () => Array.from(new Set(devices.map((d) => d.country))).sort(),
    [devices]
  );

  const filtered = devices.filter(
    (d) =>
      (!type || d.type === type) &&
      (!country || d.country === country) &&
      (!status || d.status === status) &&
      (!q || d.name.toLowerCase().includes(q.toLowerCase()) || d.serial.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div>
      <div className="section-title">
        <h2>{t('devices.title')} <span className="muted">({filtered.length})</span></h2>
        {capabilities.manageDevices && (
          <button className="btn" onClick={() => setShowAdd(true)}>+ {t('devices.add')}</button>
        )}
      </div>

      <div className="toolbar">
        <input className="grow" placeholder={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">{t('common.all')} · {t('common.type')}</option>
          {TYPES.map((tp) => <option key={tp} value={tp}>{t(`deviceType.${tp}`)}</option>)}
        </select>
        <select value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="">{t('common.all')} · {t('common.country')}</option>
          {countries.map((c) => <option key={c} value={c}>{t(`country.${c}`, c)}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t('common.all')} · {t('common.status')}</option>
          <option value="online">{t('common.online')}</option>
          <option value="offline">{t('common.offline')}</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('common.name')}</th>
                <th>{t('common.type')}</th>
                <th>{t('common.country')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.alarm')}</th>
                <th>{t('common.serial')}</th>
                <th>{t('common.lastSeen')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} onClick={() => nav(`/devices/${d.id}`)}>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td>{t(`deviceType.${d.type}`)}</td>
                  <td>{t(`country.${d.country}`, d.country)}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td><AlarmBadge alarm={d.alarm} /></td>
                  <td className="muted">{d.serial}</td>
                  <td className="muted">{d.last_seen ? new Date(d.last_seen).toLocaleTimeString() : t('common.never')}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 30 }}>{t('devices.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <DeviceFormModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}
