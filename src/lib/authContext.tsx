'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';
import { getSocket, disconnectSocket } from './socket';
import { UserRole } from '@highp/shared';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: string;
}

interface AuthCompany {
  id: string;
  name: string;
  slug: string;
  config?: any;
}

interface AuthContextType {
  user: AuthUser | null;
  company: AuthCompany | null;
  profile: any | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (data: any) => Promise<any>;
  registerCompany: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [company, setCompany] = useState<AuthCompany | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const storedToken = localStorage.getItem('highp_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      setToken(storedToken);

      const cachedUser = localStorage.getItem('highp_user');
      if (cachedUser) {
        try { setUser(JSON.parse(cachedUser)); } catch {}
      }

      const cachedCompany = localStorage.getItem('highp_company');
      if (cachedCompany) {
        try { setCompany(JSON.parse(cachedCompany)); } catch {}
      }

      const res = await api.get('/auth/me');
      if (res.data && res.data.data) {
        const u = res.data.data.user;
        const c = res.data.data.company;
        const p = res.data.data.profile;
        setUser(u);
        setCompany(c);
        setProfile(p);
        localStorage.setItem('highp_user', JSON.stringify(u));
        localStorage.setItem('highp_company', JSON.stringify(c));
        getSocket(storedToken);
      }
    } catch (err) {
      localStorage.removeItem('highp_token');
      localStorage.removeItem('highp_user');
      localStorage.removeItem('highp_company');
      setUser(null);
      setCompany(null);
      setProfile(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: u, company: c, tokens, profile: p } = res.data.data;

    localStorage.setItem('highp_token', tokens.accessToken);
    localStorage.setItem('highp_refresh_token', tokens.refreshToken);
    localStorage.setItem('highp_user', JSON.stringify(u));
    localStorage.setItem('highp_company', JSON.stringify(c));

    setToken(tokens.accessToken);
    setUser(u);
    setCompany(c);
    if (p) setProfile(p);

    // Connect socket asynchronously
    getSocket(tokens.accessToken);

    return res.data;
  };

  const signup = async (data: any) => {
    const res = await api.post('/auth/signup', data);
    const { user: u, company: c, tokens, profile: p } = res.data.data;

    localStorage.setItem('highp_token', tokens.accessToken);
    localStorage.setItem('highp_refresh_token', tokens.refreshToken);
    localStorage.setItem('highp_user', JSON.stringify(u));
    localStorage.setItem('highp_company', JSON.stringify(c));

    setToken(tokens.accessToken);
    setUser(u);
    setCompany(c);
    if (p) setProfile(p);

    getSocket(tokens.accessToken);

    return res.data;
  };

  const registerCompany = async (data: any) => {
    const res = await api.post('/auth/register', data);
    const { user: u, company: c, tokens } = res.data.data;

    localStorage.setItem('highp_token', tokens.accessToken);
    localStorage.setItem('highp_refresh_token', tokens.refreshToken);
    setToken(tokens.accessToken);
    setUser(u);
    setCompany(c);

    getSocket(tokens.accessToken);

    await fetchCurrentUser();
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('highp_token');
    localStorage.removeItem('highp_refresh_token');
    setUser(null);
    setCompany(null);
    setProfile(null);
    setToken(null);
    disconnectSocket();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        profile,
        token,
        isLoading,
        login,
        signup,
        registerCompany,
        logout,
        refreshAuth: fetchCurrentUser
      }}
    >
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
