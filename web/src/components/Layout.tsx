import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/auth';
import { LanguageSwitcher } from './LanguageSwitcher';
import { RoleBadge } from './Badges';

export function Layout() {
  const { t } = useTranslation();
  const { user, capabilities, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const items = [
    { to: '/', icon: '▦', label: t('nav.dashboard'), show: true, end: true },
    { to: '/devices', icon: '⚙', label: t('nav.devices'), show: true },
    { to: '/countries', icon: '🌐', label: t('nav.countries'), show: capabilities.viewCountryBreakdown },
    { to: '/users', icon: '👥', label: t('nav.users'), show: capabilities.manageUsers }
  ].filter((i) => i.show);

  return (
    <div className="app">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="logo">W</div>
          <div>
            <div className="name">{t('app.title')}</div>
            <div className="sub">{t('app.tagline')}</div>
          </div>
        </div>
        {items.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            <span className="ico">{i.icon}</span>
            {i.label}
          </NavLink>
        ))}
        <div className="spacer" />
        <div className="user-card">
          <div style={{ fontWeight: 600 }}>{user?.name}</div>
          <div className="muted" style={{ fontSize: 12 }}>@{user?.username}</div>
          <div className="role-badge">{user && <RoleBadge role={user.role} />}</div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="btn ghost sm menu-toggle" onClick={() => setOpen((o) => !o)}>
            ☰
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <LanguageSwitcher />
            <button
              className="btn ghost sm"
              onClick={() => {
                logout();
                nav('/login');
              }}
            >
              {t('nav.logout')}
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
