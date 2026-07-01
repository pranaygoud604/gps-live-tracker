import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import { disconnectSocket } from '@/services/socket';

interface LoginParams {
  vehicleNumber?: string;
  username?: string;
  password: string;
}

export function useAuth() {
  const { user, token, isAuthenticated, login, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = useCallback(
    async (params: LoginParams): Promise<void> => {
      const data = await authApi.login(params);
      login(data.user, data.token);

      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/driver');
      }
    },
    [login, navigate],
  );

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    } finally {
      disconnectSocket();
      storeLogout();
      navigate('/login');
    }
  }, [storeLogout, navigate]);

  return {
    user,
    token,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
  };
}
