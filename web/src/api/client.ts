import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !location.pathname.startsWith('/login')) {
      localStorage.removeItem('token');
      location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export type Role = 'admin' | 'dealer' | 'user';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  country?: string;
  locale?: string;
  dealer_id?: string | null;
}

export interface Capabilities {
  viewDevices?: boolean;
  viewTelemetry?: boolean;
  viewDashboard?: boolean;
  manageUsers?: boolean;
  manageDealers?: boolean;
  manageDevices?: boolean;
  viewCountryBreakdown?: boolean;
  viewAllDealers?: boolean;
}

export interface Device {
  id: string;
  serial: string;
  name: string;
  type: string;
  country: string;
  status: 'online' | 'offline';
  alarm: 'normal' | 'warning' | 'critical';
  firmware: string;
  last_seen: number | null;
  owner_name?: string;
  dealer_name?: string;
  owner_user_id?: string;
  dealer_id?: string;
}
