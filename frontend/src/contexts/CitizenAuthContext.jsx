import React, { createContext, useContext, useState, useEffect } from 'react';
import { citizenAuthApi } from '../api/portalClient';
import { message } from 'antd';

const CitizenAuthContext = createContext(null);

export const CitizenAuthProvider = ({ children }) => {
  const [citizen, setCitizen] = useState(() => {
    try {
      const stored = localStorage.getItem('citizen_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('citizen_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await citizenAuthApi.me();
          if (res?.data) {
            setCitizen(res.data);
            localStorage.setItem('citizen_user', JSON.stringify(res.data));
          }
        } catch {
          // Token không hợp lệ hoặc hết hạn
          setCitizen(null);
          setToken(null);
          localStorage.removeItem('citizen_user');
          localStorage.removeItem('citizen_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (identifier, password) => {
    try {
      const res = await citizenAuthApi.login({ identifier, password });
      if (res?.data?.token) {
        setToken(res.data.token);
        setCitizen(res.data.citizen);
        localStorage.setItem('citizen_token', res.data.token);
        localStorage.setItem('citizen_user', JSON.stringify(res.data.citizen));
        message.success('Đăng nhập thành công! Chào mừng ' + res.data.citizen.full_name);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const register = async (formData) => {
    try {
      const res = await citizenAuthApi.register(formData);
      if (res?.data?.token) {
        setToken(res.data.token);
        setCitizen(res.data.citizen);
        localStorage.setItem('citizen_token', res.data.token);
        localStorage.setItem('citizen_user', JSON.stringify(res.data.citizen));
        message.success('Đăng ký tài khoản thành công! Chào mừng Quý công dân.');
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const logout = async () => {
    try {
      await citizenAuthApi.logout();
    } catch {
      // Bỏ qua lỗi logout
    } finally {
      setCitizen(null);
      setToken(null);
      localStorage.removeItem('citizen_user');
      localStorage.removeItem('citizen_token');
      message.info('Đã đăng xuất khỏi Cổng Dịch vụ công');
    }
  };

  const refreshCitizen = async () => {
    try {
      const res = await citizenAuthApi.me();
      if (res?.data) {
        setCitizen(res.data);
        localStorage.setItem('citizen_user', JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      console.error('Error refreshing citizen info:', err);
    }
    return null;
  };

  return (
    <CitizenAuthContext.Provider
      value={{
        citizen,
        token,
        loading,
        login,
        register,
        logout,
        refreshCitizen,
        setCitizen,
      }}
    >
      {children}
    </CitizenAuthContext.Provider>
  );
};

export const useCitizenAuth = () => {
  const context = useContext(CitizenAuthContext);
  if (!context) {
    throw new Error('useCitizenAuth must be used within a CitizenAuthProvider');
  }
  return context;
};
