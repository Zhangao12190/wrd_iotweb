import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import { api } from '../api/client';
import { useRealtime } from '../hooks/useRealtime';
import { AlarmBadge } from '../components/Badges';

const TYPE_COLORS = ['#4f8cff', '#7b5cff', '#2ecc8f', '#f5a623'];

interface Overview {
  total: number; online: number; offline: number; warning: number; critical: number;
  byType: Record<string, number>;
  byStatus: { online: number; offline: number };
}

interface Alarm {
  ts: number; level: string; message: string; serial: string; type: string; country: string; device_id: string;
}

function StatCard({ icon, color, label, value }: { icon: string; color: string; label: string; value: number }) {
  return (
    <div className="card stat">
      <div className="stat-row">
        <div className="icon" style={{ background: `${color}22`, color }}>{icon}</div>
      </div>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

export function Dashboard() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [ov, setOv] = useState<Overview | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  const load = useCallback(() => {
    api.get('/stats/overview').then((r) => setOv(r.data));
    api.get('/stats/alarms').then((r) => setAlarms(r.data.alarms));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  // refresh alarm feed live
  useRealtime(
    useCallback((msg: any) => {
      if (msg.type === 'event') {
        setAlarms((prev) => [
          { ts: msg.ts, level: msg.level, message: msg.message, serial: '', type: '', country: '', device_id: msg.deviceId },
          ...prev
        ].slice(0, 50));
      }
    }, [])
  );

  if (!ov) return <div className="center-screen">{t('common.loading')}</div>;

  const typeData = Object.entries(ov.byType).map(([k, v]) => ({ name: t(`deviceType.${k}`), value: v, key: k }));
  const statusData = [
    { name: t('common.online'), value: ov.byStatus.online },
    { name: t('common.offline'), value: ov.byStatus.offline }
  ];

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="grid cards">
        <StatCard icon="⚙" color="#4f8cff" label={t('dashboard.totalDevices')} value={ov.total} />
        <StatCard icon="●" color="#2ecc8f" label={t('dashboard.onlineDevices')} value={ov.online} />
        <StatCard icon="▲" color="#f5a623" label={t('dashboard.warnings')} value={ov.warning} />
        <StatCard icon="✖" color="#ff5d5d" label={t('dashboard.criticals')} value={ov.critical} />
      </div>

      <div className="row">
        <div className="card" style={{ flex: '1 1 320px' }}>
          <h3>{t('dashboard.byType')}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={typeData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50}>
                {typeData.map((_, i) => (
                  <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ flex: '1 1 320px' }}>
          <h3>{t('dashboard.byStatus')}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50}>
                <Cell fill="#2ecc8f" />
                <Cell fill="#8a96b4" />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ flex: '1 1 320px' }}>
          <h3>{t('dashboard.byType')}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={typeData}>
              <XAxis dataKey="name" tick={{ fill: '#8a96b4', fontSize: 11 }} interval={0} />
              <YAxis tick={{ fill: '#8a96b4', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {typeData.map((_, i) => (
                  <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>{t('dashboard.recentAlarms')}</h3>
        {alarms.length === 0 ? (
          <div className="muted">{t('dashboard.noAlarms')}</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('common.alarm')}</th>
                  <th>{t('common.serial')}</th>
                  <th>{t('common.country')}</th>
                  <th>{t('common.lastSeen')}</th>
                </tr>
              </thead>
              <tbody>
                {alarms.map((a, i) => (
                  <tr key={i} onClick={() => a.device_id && nav(`/devices/${a.device_id}`)}>
                    <td><AlarmBadge alarm={a.level as any} /></td>
                    <td>{a.serial || '—'}</td>
                    <td>{a.country ? t(`country.${a.country}`) : '—'}</td>
                    <td className="muted">{new Date(a.ts).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: '#161f3a',
  border: '1px solid #243154',
  borderRadius: 10,
  color: '#e6ebf5'
} as const;
