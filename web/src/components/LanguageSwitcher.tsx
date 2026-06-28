import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';
import { api } from '../api/client';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  function change(code: string) {
    i18n.changeLanguage(code);
    localStorage.setItem('locale', code);
    document.documentElement.lang = code;
    if (localStorage.getItem('token')) {
      api.put('/auth/me/locale', { locale: code }).catch(() => {});
    }
  }
  return (
    <div className="lang">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          className={i18n.language === l.code ? 'active' : ''}
          onClick={() => change(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
