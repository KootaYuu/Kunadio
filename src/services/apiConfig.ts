const viteEnv = import.meta.env || {};
const rawApiBase = viteEnv.VITE_API_BASE_URL || '/api';

export const API_BASE = rawApiBase.replace(/\/$/, '');
export const NETEASE_API_BASE = `${API_BASE}/netease`;
