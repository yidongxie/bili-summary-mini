import { createContext, useContext, useState, useCallback, useEffect, type PropsWithChildren } from 'react';
import Taro from '@tarojs/taro';
import { getMe, wechatLogin, type CurrentUser } from '@/lib/api';

interface AuthState {
  user: CurrentUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true, login: async () => {}, logout: async () => {}, refresh: async () => {} });

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data.authenticated ? data.user ?? null : null);
    } catch { setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async () => {
    try {
      const { code } = await Taro.login();
      const data = await wechatLogin(code);
      setUser(data.user);
    } catch (err) {
      console.error('[auth] WeChat login failed:', err);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { logout: apiLogout } = await import('@/lib/api');
      await apiLogout();
    } catch {}
    Taro.removeStorageSync('session-cookie');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
