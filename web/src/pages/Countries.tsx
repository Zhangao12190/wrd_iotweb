import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { api } from '../api/client';

interface CountryRow {
  country: string; total: number; online: number; warning: number; critical: number;
}

const TYPE_COLORS: Record<string, string> = {
  plasma_cutter: '#4f8cff',
  welder: '#7b5cff',
  water_tank: '#2ecc8f',
  gas_control_box: '#f5a623'
};

export function Countries() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [rows, setRows] = useState<CountryRow[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, number>>>({});
  const [types, setTypes] = useState<string[]>([]);

  useEffect(() => {
    api.get('/stats/by-country').then((r) => {
      setRows(r.data.countries);
      setMatrix(r.data.matrix);
      setTypes(r.data.types);
    });
  }, []);

  const barData = rows.map((r) => ({ name: t(`country.${r.country}`, r.country), total: r.total, code: r.country }));
  const maxCell = Math.max(1, ...Object.values(matrix).flatMap((m) => Object.values(m)));

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="section-title">
        <div>
          <h2 style={{ margin: 0 }}>{t('countries.title')}</h2>
          <div className="muted" style={{ fontSize: 13 }}>{t('countries.subtitle')}</div>
        </div>
      </div>

      <div className="card">
        <h3>{t('countries.deviceCount')}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData}>
            <XAxis dataKey="name" tick={{ fill: '#8a96b4', fontSize: 12 }} />
            <YAxis tick={{ fill: '#8a96b4', fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#161f3a', border: '1px solid #243154', borderRadius: 10 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#4f8cff" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="row">
        <div className="card" style={{ flex: '1 1 420px' }}>
          <h3>{t('countries.title')}</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('common.country')}</th>
                  <th>{t('common.total')}</th>
                  <th>{t('common.online')}</th>
                  <th>{t('common.warning')}</th>
                  <th>{t('common.critical')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.country} onClick={() => nav(`/devices?country=${r.country}`)}>
                    <td style={{ fontWeight: 600 }}>{t(`country.${r.country}`, r.country)}</td>
                    <td>{r.total}</td>
                    <td style={{ color: 'var(--green)' }}>{r.online}</td>
                    <td style={{ color: 'var(--amber)' }}>{r.warning}</td>
                    <td style={{ color: 'var(--red)' }}>{r.critical}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 24 }}>{t('common.noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ flex: '1 1 420px' }}>
          <h3>{t('countries.matrix')}</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('common.country')}</th>
                  {types.map((tp) => <th key={tp} style={{ textAlign: 'center' }}>{t(`deviceType.${tp}`)}</th>)}
                </tr>
              </thead>
              <tbody>
                {Object.keys(matrix).map((c) => (
                  <tr key={c}>
                    <td style={{ fontWeight: 600 }}>{t(`country.${c}`, c)}</td>
                    {types.map((tp) => {
                      const v = matrix[c]?.[tp] || 0;
                      const intensity = v / maxCell;
                      return (
                        <td key={tp} style={{ textAlign: 'center' }}>
                          <span
                            className="heatcell"
                            style={{
                              background: v ? `${TYPE_COLORS[tp]}${Math.round(40 + intensity * 120).toString(16).padStart(2, '0')}` : 'transparent',
                              color: v ? '#fff' : 'var(--muted)'
                            }}
                          >
                            {v}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
