import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type User, type Capabilities } from '../api/client';

interface AuthState {
  user: User | null;
  capabilities: Capabilities;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>(null as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [capabilities, setCapabilities] = useState<Capabilities>({});
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((r) => {
        setUser(r.data.user);
        setCapabilities(r.data.capabilities);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function login(username: string, password: string) {
    const r = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', r.data.token);
    setToken(r.data.token);
    setUser(r.data.user);
    setCapabilities(r.data.capabilities);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCapabilities({});
  }

  return (
    <AuthContext.Provider value={{ user, capabilities, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
