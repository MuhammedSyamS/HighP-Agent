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
  companyId?: string;
  employeeProfileId?: string;
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
  loginWithOtp: (email: string, otp: string) => Promise<any>;
  sendOtp: (email: string, purpose: 'LOGIN' | 'FORGOT_PASSWORD' | 'SIGNUP') => Promise<any>;
  resetPasswordWithOtp: (email: string, otp: string, newPassword: string) => Promise<any>;
  signup: (data: any) => Promise<any>;
  registerCompany: (data: any) => Promise<any>;
  logout: (redirectUrl?: string | any) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('highp_user');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  const [company, setCompany] = useState<AuthCompany | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('highp_company');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  const [profile, setProfile] = useState<any | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('highp_profile');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('highp_token');
    }
    return null;
  });

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

      const cachedProfile = localStorage.getItem('highp_profile');
      if (cachedProfile) {
        try { setProfile(JSON.parse(cachedProfile)); } catch {}
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
        if (p) {
          localStorage.setItem('highp_profile', JSON.stringify(p));
        }
        getSocket(storedToken);
      }
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        localStorage.removeItem('highp_token');
        localStorage.removeItem('highp_refresh_token');
        localStorage.removeItem('highp_user');
        localStorage.removeItem('highp_company');
        localStorage.removeItem('highp_profile');
        setUser(null);
        setCompany(null);
        setProfile(null);
        setToken(null);
      } else {
        // Network timeout / offline / cold start: retain cached session so user isn't logged out
        console.warn('[AuthContext] Session verification network warning:', err?.message);
      }
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
    if (u?.email) {
      localStorage.setItem('highp_last_email', u.email);
    }
    if (p) {
      localStorage.setItem('highp_profile', JSON.stringify(p));
    }

    setToken(tokens.accessToken);
    setUser(u);
    setCompany(c);
    if (p) setProfile(p);

    // Connect socket asynchronously
    getSocket(tokens.accessToken);

    return res.data;
  };

  const sendOtp = async (email: string, purpose: 'LOGIN' | 'FORGOT_PASSWORD' | 'SIGNUP') => {
    const res = await api.post('/auth/otp/send', { email, purpose });
    return res.data;
  };

  const loginWithOtp = async (email: string, otp: string) => {
    const res = await api.post('/auth/otp/verify-login', { email, otp });
    const { user: u, company: c, tokens, profile: p } = res.data.data;

    localStorage.setItem('highp_token', tokens.accessToken);
    localStorage.setItem('highp_refresh_token', tokens.refreshToken);
    localStorage.setItem('highp_user', JSON.stringify(u));
    localStorage.setItem('highp_company', JSON.stringify(c));
    if (u?.email) {
      localStorage.setItem('highp_last_email', u.email);
    }
    if (p) {
      localStorage.setItem('highp_profile', JSON.stringify(p));
    }

    setToken(tokens.accessToken);
    setUser(u);
    setCompany(c);
    if (p) setProfile(p);

    getSocket(tokens.accessToken);
    return res.data;
  };

  const resetPasswordWithOtp = async (email: string, otp: string, newPassword: string) => {
    const res = await api.post('/auth/otp/reset-password', { email, otp, newPassword });
    return res.data;
  };

  const signup = async (data: any) => {
    const res = await api.post('/auth/signup', data);
    const { user: u, company: c, tokens, profile: p } = res.data.data;

    localStorage.setItem('highp_token', tokens.accessToken);
    localStorage.setItem('highp_refresh_token', tokens.refreshToken);
    localStorage.setItem('highp_user', JSON.stringify(u));
    localStorage.setItem('highp_company', JSON.stringify(c));
    if (u?.email) {
      localStorage.setItem('highp_last_email', u.email);
    }
    if (p) {
      localStorage.setItem('highp_profile', JSON.stringify(p));
    }

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

  const logout = async (redirectUrl?: string | any) => {
    try {
      await api.post('/auth/logout');
    } catch {}
    if (user?.email) {
      localStorage.setItem('highp_last_email', user.email);
    }
    localStorage.removeItem('highp_token');
    localStorage.removeItem('highp_refresh_token');
    localStorage.removeItem('highp_user');
    localStorage.removeItem('highp_company');
    localStorage.removeItem('highp_profile');
    setUser(null);
    setCompany(null);
    setProfile(null);
    setToken(null);
    disconnectSocket();
    const targetUrl = typeof redirectUrl === 'string' ? redirectUrl : '/login';
    window.location.href = targetUrl;
  };

  // Idle Auto-Logout: automatically logs out after 30 minutes of user inactivity
  useEffect(() => {
    if (!token || !user) return;

    const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    let timeoutId: NodeJS.Timeout;

    const performAutoLogout = () => {
      const email = user?.email || '';
      if (email) {
        localStorage.setItem('highp_last_email', email);
      }
      localStorage.setItem('highp_session_expired', 'true');
      logout('/login?reason=idle_timeout');
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(performAutoLogout, IDLE_TIMEOUT_MS);
    };

    let lastInteraction = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastInteraction > 5000) {
        lastInteraction = now;
        resetTimer();
      }
    };

    resetTimer();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
    };
  }, [token, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        profile,
        token,
        isLoading,
        login,
        loginWithOtp,
        sendOtp,
        resetPasswordWithOtp,
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
