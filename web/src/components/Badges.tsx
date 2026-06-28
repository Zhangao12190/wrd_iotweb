import { useTranslation } from 'react-i18next';

export function StatusBadge({ status }: { status: 'online' | 'offline' }) {
  const { t } = useTranslation();
  return (
    <span className={`badge ${status}`}>
      <span className="dot" style={{ background: status === 'online' ? 'var(--green)' : 'var(--muted)' }} />
      {t(`common.${status}`)}
    </span>
  );
}

export function AlarmBadge({ alarm }: { alarm: 'normal' | 'warning' | 'critical' }) {
  const { t } = useTranslation();
  return <span className={`badge ${alarm}`}>{t(`common.${alarm}`)}</span>;
}

export function RoleBadge({ role }: { role: string }) {
  const { t } = useTranslation();
  return <span className="badge role">{t(`role.${role}`)}</span>;
}
