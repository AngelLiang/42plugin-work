import { useState, useEffect } from 'react';
import { checkAuth, fetchStatus, login, logout } from '@/lib/42plugin/api';
import { StatusData } from '@/lib/42plugin/types';

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface LogoutResult {
  success: boolean;
  error?: string;
}

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshStatus = async () => {
    try {
      const auth = await checkAuth();
      setIsLoggedIn(auth.loggedIn);
      setUsername(auth.username);

      if (auth.loggedIn) {
        const status = await fetchStatus();
        setStatusData(status);
      } else {
        setStatusData(null);
      }
    } catch (error) {
      console.error('Failed to refresh status:', error);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleLogin = async (): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      await login();
      await refreshStatus();
      return { success: true };
    } catch (error) {
      return { success: false, error: '登录失败' };
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async (): Promise<LogoutResult> => {
    setIsLoading(true);
    try {
      await logout();
      setIsLoggedIn(false);
      setUsername('');
      setStatusData(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: '退出失败' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoggedIn,
    username,
    statusData,
    isLoading,
    handleLogin,
    handleLogout,
    refreshStatus,
  };
}
