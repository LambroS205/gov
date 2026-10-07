import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';
import { message } from 'antd';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('gov_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('gov_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authApi.me();
          if (res?.data) {
            setUser(res.data);
            localStorage.setItem('gov_user', JSON.stringify(res.data));
          }
        } catch {
          // Token không hợp lệ
          setUser(null);
          setToken(null);
          localStorage.removeItem('gov_user');
          localStorage.removeItem('gov_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (username, password) => {
    try {
      const res = await authApi.login({ username, password });
      if (res?.data?.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('gov_token', res.data.token);
        localStorage.setItem('gov_user', JSON.stringify(res.data.user));
        message.success('Đăng nhập thành công! Chào mừng ' + res.data.user.full_name);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Bỏ qua lỗi khi logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('gov_user');
      localStorage.removeItem('gov_token');
      message.info('Đã đăng xuất khỏi hệ thống');
    }
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
