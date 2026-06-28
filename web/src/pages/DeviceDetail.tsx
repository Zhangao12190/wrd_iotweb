import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import { api, type Device } from '../api/client';
import { useRealtime } from '../hooks/useRealtime';
import { StatusBadge, AlarmBadge } from '../components/Badges';
import { DEVICE_METRICS, chartMetrics } from '../api/deviceTypes';

const LINE_COLORS = ['#4f8cff', '#2ecc8f', '#f5a623'];
const MAX_POINTS = 40;

type Point = { ts: number } & Record<string, number>;

export function DeviceDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const nav = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [series, setSeries] = useState<Point[]>([]);
  const [latest, setLatest] = useState<Record<string, number>>({});
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    api.get(`/devices/${id}`).then((r) => setDevice(r.data.device)).catch(() => nav('/devices'));
    api.get(`/telemetry/${id}?limit=40`).then((r) => {
      const hist = r.data.history as Point[];
      setSeries(hist);
      if (hist.length) {
        const { ts, alarm, ...rest } = hist[hist.length - 1] as any;
        setLatest(rest);
      }
    });
    api.get(`/telemetry/${id}/events`).then((r) => setEvents(r.data.events));
  }, [id, nav]);

  const { connected } = useRealtime(
    useCallback(
      (msg: any) => {
        if (msg.type === 'telemetry' && msg.deviceId === id) {
          setLatest(msg.payload);
          setSeries((prev) => [...prev, { ts: msg.ts, ...msg.payload }].slice(-MAX_POINTS));
          setDevice((d) => (d ? { ...d, status: 'online', alarm: msg.alarm, last_seen: msg.ts } : d));
        } else if (msg.type === 'status' && msg.deviceId === id) {
          setDevice((d) => (d ? { ...d, status: msg.status, alarm: msg.alarm, last_seen: msg.last_seen } : d));
        } else if (msg.type === 'event' && msg.deviceId === id) {
          setEvents((prev) => [{ ts: msg.ts, level: msg.level, code: msg.code, message: msg.message }, ...prev].slice(0, 50));
        }
      },
      [id]
    )
  );

  if (!device) return <div className="center-screen">{t('common.loading')}</div>;

  const metrics = DEVICE_METRICS[device.type] || [];
  const lines = chartMetrics(device.type);

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="section-title">
        <div>
          <button className="btn ghost sm" onClick={() => nav('/devices')} style={{ marginBottom: 10 }}>← {t('devices.title')}</button>
          <h2 style={{ margin: 0 }}>{device.name}</h2>
          <div className="muted" style={{ fontSize: 13 }}>{t(`deviceType.${device.type}`)} · {device.serial}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={`live-dot ${connected ? 'on' : 'off'}`} />
          <span className="muted" style={{ fontSize: 13 }}>{connected ? t('detail.connected') : t('detail.disconnected')}</span>
        </div>
      </div>

      <div className="row">
        <div className="card" style={{ flex: '1 1 240px' }}>
          <h3>{t('detail.info')}</h3>
          <InfoRow label={t('common.status')} value={<StatusBadge status={device.status} />} />
          <InfoRow label={t('common.alarm')} value={<AlarmBadge alarm={device.alarm} />} />
          <InfoRow label={t('common.country')} value={t(`country.${device.country}`, device.country)} />
          <InfoRow label={t('common.firmware')} value={device.firmware} />
          {device.owner_name && <InfoRow label={t('common.owner')} value={device.owner_name} />}
          {device.dealer_name && <InfoRow label={t('common.dealer')} value={device.dealer_name} />}
          <InfoRow label={t('common.lastSeen')} value={device.last_seen ? new Date(device.last_seen).toLocaleString() : t('common.never')} />
        </div>

        <div className="card" style={{ flex: '3 1 460px' }}>
          <h3>{t('detail.metrics')}</h3>
          <div className="metric-grid">
            {metrics.map((m) => {
              const v = latest[m.key];
              return (
                <div className="metric-tile" key={m.key}>
                  <div className="m-label">{t(`metric.${m.key}`)}</div>
                  <div className="m-value">
                    {v == null ? '—' : m.bool ? (v >= 1 ? 'ON' : 'OFF') : v}
                    {!m.bool && m.unit && <span className="m-unit"> {m.unit}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>{t('detail.realtime')}</h3>
        {series.length === 0 ? (
          <div className="muted" style={{ padding: 20 }}>{t('detail.noTelemetry')}</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={series}>
              <CartesianGrid stroke="#243154" strokeDasharray="3 3" />
              <XAxis
                dataKey="ts"
                tick={{ fill: '#8a96b4', fontSize: 11 }}
                tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                minTickGap={40}
              />
              <YAxis tick={{ fill: '#8a96b4', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#161f3a', border: '1px solid #243154', borderRadius: 10 }}
                labelFormatter={(ts) => new Date(ts as number).toLocaleTimeString()}
              />
              <Legend />
              {lines.map((m, i) => (
                <Line
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={`${t(`metric.${m.key}`)} (${m.unit})`}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  dot={false}
                  isAnimationActive={false}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h3>{t('detail.events')}</h3>
        {events.length === 0 ? (
          <div className="muted">{t('dashboard.noAlarms')}</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>{t('common.alarm')}</th><th>Code</th><th></th><th>{t('common.lastSeen')}</th></tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={i}>
                    <td><AlarmBadge alarm={e.level} /></td>
                    <td className="muted">{e.code}</td>
                    <td>{e.message}</td>
                    <td className="muted">{new Date(e.ts).toLocaleString()}</td>
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span className="muted" style={{ fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: 14 }}>{value}</span>
    </div>
  );
}
