import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../lib/authContext';
import {
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Briefcase,
  LogIn,
  UserPlus,
  ShieldCheck,
  Building,
  Smartphone,
  RefreshCw,
  Sparkles,
  Key
} from 'lucide-react';
import { UserRole } from '@highp/shared';

type AuthMode = 'login' | 'signup';
type LoginMethod = 'password' | 'otp';

const DEPARTMENTS = [
  'Engineering & Development',
  'Design & Creative',
  'Marketing & Growth',
  'Operations & Logistics',
  'Customer Success & Support',
  'General'
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithOtp, sendOtp, resetPasswordWithOtp, signup } = useAuth();

  // Mode: login or signup
  const isSignup = location.pathname === '/signup';
  const [authMode, setAuthMode] = useState<AuthMode>(isSignup ? 'signup' : 'login');

  // Check for session timeout
  const queryParams = new URLSearchParams(location.search);
  const isSessionExpired =
    queryParams.get('reason') === 'idle_timeout' ||
    queryParams.get('reason') === 'session_expired' ||
    (typeof window !== 'undefined' && localStorage.getItem('highp_session_expired') === 'true');
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(isSessionExpired);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('highp_session_expired')) {
      localStorage.removeItem('highp_session_expired');
    }
  }, []);

  // Login Method: default to 'otp' as primary
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('otp');

  // Sign In - Password state
  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('highp_last_email') || '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Sign In - OTP state
  const [otpEmail, setOtpEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('highp_last_email') || '';
    }
    return '';
  });
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Sign Up state (Unified Password & OTP)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [department, setDepartment] = useState('Engineering & Development');
  const [signupOtp, setSignupOtp] = useState('');
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [signupOtpSending, setSignupOtpSending] = useState(false);
  const [signupOtpSuccessMessage, setSignupOtpSuccessMessage] = useState('');
  const [signupResendCountdown, setSignupResendCountdown] = useState(0);
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  useEffect(() => {
    if (signupResendCountdown <= 0) return;
    const timer = setTimeout(() => {
      setSignupResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [signupResendCountdown]);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1: Enter email, 2: Enter code & new pass, 3: Success
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // 1. Password Login Handler
  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = email.trim();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setLoginError('Please enter a valid work email address (e.g. name@company.com).');
      return;
    }

    setLoginLoading(true);

    try {
      const res = await login(cleanEmail, password);
      const userRole = res.data?.user?.role || res.user?.role || UserRole.EMPLOYEE;
      if (userRole === UserRole.EMPLOYEE) {
        navigate('/employee');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.errors?.map((item: any) => item.message).join(', ') ||
        err.response?.data?.message ||
        err.message;
      setLoginError(
        serverMsg || 'Invalid email or password. Please verify your credentials or click "Sign In with OTP".'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // 2. OTP Send Code Handler
  const handleSendLoginOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOtpError('');
    setOtpSuccessMessage('');

    const cleanEmail = otpEmail.trim();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setOtpError('Please enter a valid work email address.');
      return;
    }

    setOtpSending(true);

    try {
      const res = await sendOtp(cleanEmail, 'LOGIN');
      setOtpSent(true);
      setOtpSuccessMessage(res.message || 'Verification code sent to your email inbox! Please check your messages.');
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.errors?.map((item: any) => item.message).join(', ') ||
        err.response?.data?.message ||
        err.message;
      setOtpError(serverMsg || 'Unable to send OTP. Please check if this email is registered.');
    } finally {
      setOtpSending(false);
    }
  };

  // 3. OTP Verify & Sign In Handler
  const handleVerifyOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    const cleanEmail = otpEmail.trim();
    const cleanCode = otpCode.trim();

    if (!cleanCode || cleanCode.length < 6) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setOtpLoading(true);

    try {
      const res = await loginWithOtp(cleanEmail, cleanCode);
      const userRole = res.data?.user?.role || res.user?.role || UserRole.EMPLOYEE;
      if (userRole === UserRole.EMPLOYEE) {
        navigate('/employee');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.errors?.map((item: any) => item.message).join(', ') ||
        err.response?.data?.message ||
        err.message;
      setOtpError(serverMsg || 'Invalid or expired verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // 4a. Employee Sign Up - Send OTP
  const handleSendSignupOtp = async () => {
    setSignupError('');
    setSignupOtpSuccessMessage('');

    const cleanEmail = signupEmail.trim();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setSignupError('Please enter a valid work email address before requesting a verification code.');
      return;
    }

    setSignupOtpSending(true);

    try {
      const res = await sendOtp(cleanEmail, 'SIGNUP');
      setSignupOtpSent(true);
      setSignupResendCountdown(60);
      setSignupOtpSuccessMessage(res.message || 'Verification code sent to your email inbox! Please check your messages.');
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.errors?.map((item: any) => item.message).join(', ') ||
        err.response?.data?.message ||
        err.message;
      setSignupError(serverMsg || 'Unable to send verification code. Please check your email.');
    } finally {
      setSignupOtpSending(false);
    }
  };

  // 4b. Employee Sign Up Handler (Password + OTP together)
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    const cleanEmail = signupEmail.trim();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setSignupError('Please enter a complete email address including domain (e.g. name@company.com).');
      return;
    }

    if (signupPassword.length < 8) {
      setSignupError('Password must be at least 8 characters long.');
      return;
    }

    const cleanOtp = signupOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      if (!signupOtpSent) {
        // Automatically dispatch OTP to the user's email
        await handleSendSignupOtp();
        return;
      }
      setSignupError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setSignupLoading(true);

    try {
      await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        password: signupPassword,
        otp: cleanOtp,
        department
      });
      navigate('/employee');
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.errors?.map((item: any) => item.message).join(', ') ||
        err.response?.data?.message ||
        err.message;
      setSignupError(
        serverMsg || 'Unable to create account. Please check your verification code or if email is already registered.'
      );
    } finally {
      setSignupLoading(false);
    }
  };

  // 5. Forgot Password Step 1: Send Reset OTP
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setForgotError('Please enter a valid work email address.');
      return;
    }

    setForgotLoading(true);

    try {
      await sendOtp(cleanEmail, 'FORGOT_PASSWORD');
      setForgotStep(2);
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.errors?.map((item: any) => item.message).join(', ') ||
        err.response?.data?.message ||
        err.message;
      setForgotError(serverMsg || 'No account found with this email.');
    } finally {
      setForgotLoading(false);
    }
  };

  // 6. Forgot Password Step 2: Verify OTP & Reset Password
  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (forgotOtp.trim().length < 6) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }

    if (forgotNewPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please verify both fields.');
      return;
    }

    setForgotLoading(true);

    try {
      await resetPasswordWithOtp(forgotEmail.trim(), forgotOtp.trim(), forgotNewPassword);
      setForgotStep(3);
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.errors?.map((item: any) => item.message).join(', ') ||
        err.response?.data?.message ||
        err.message;
      setForgotError(serverMsg || 'Failed to reset password. Please check your verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-black selection:text-white relative overflow-hidden">
      {/* Subtle modern background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-3 group transition-transform hover:scale-102">
          <div className="w-10 h-10 rounded-xl bg-black text-white font-black text-xl flex items-center justify-center shadow-lg shadow-black/10">
            ⚡
          </div>
          <div className="text-left">
            <span className="font-black text-xl tracking-tight text-slate-900 block">
              HighP Monitor
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Workforce Telemetry SaaS
            </span>
          </div>
        </Link>

        <h2 className="mt-6 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {authMode === 'login' ? 'Sign In to Workspace' : 'Create an Account'}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          {authMode === 'login'
            ? 'Access your desktop telemetry, team analytics, and work sessions'
            : 'Get started with HighP privacy-first workspace monitor'}
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          {/* Main Auth Mode Switcher */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 border-b border-slate-200/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLoginError('');
                setOtpError('');
              }}
              className={`py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                authMode === 'login'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-slate-600 hover:text-black hover:bg-white/60'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setSignupError('');
              }}
              className={`py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                authMode === 'signup'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-slate-600 hover:text-black hover:bg-white/60'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Sign Up
            </button>
          </div>

          {/* SIGN IN TAB */}
          {authMode === 'login' && (
            <div className="p-6 sm:p-8">
              {sessionExpiredNotice && (
                <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-start gap-2.5">
                  <span className="text-base">⏳</span>
                  <div className="flex-1">
                    <p className="font-bold text-amber-900">Session Expired Due to Inactivity</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Your session timed out after an extended period of inactivity. Please enter your email to receive an OTP and sign back in.
                    </p>
                  </div>
                </div>
              )}

              {/* Login Method Sub-Switch (OTP vs Password) */}
              <div className="flex items-center justify-center p-1 bg-slate-100 rounded-xl mb-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('otp');
                    setLoginError('');
                    setOtpError('');
                    if (!otpEmail && email) setOtpEmail(email);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    loginMethod === 'otp'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-3 h-3" /> Sign In with OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('password');
                    setLoginError('');
                    setOtpError('');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    loginMethod === 'password'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Lock className="w-3 h-3" /> Password
                </button>
              </div>

              {/* METHOD 1: STANDARD PASSWORD LOGIN */}
              {loginMethod === 'password' && (
                <>
                  {loginError && (
                    <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
                      <span className="text-sm">⚠️</span>
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Work Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors placeholder:text-slate-400 font-medium"
                          placeholder="name@company.com"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (email && !forgotEmail) setForgotEmail(email);
                            setShowForgotModal(true);
                          }}
                          className="text-xs text-slate-500 hover:text-black transition-colors font-medium hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors placeholder:text-slate-400 font-medium"
                          placeholder="••••••••••••"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black"
                        />
                        <span className="text-xs text-slate-600 font-medium">Keep me signed in</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {loginLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Sign In to Workspace</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

              {/* METHOD 2: OTP (ONE-TIME PASSWORD) LOGIN */}
              {loginMethod === 'otp' && (
                <div>
                  {otpError && (
                    <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
                      <span className="text-sm">⚠️</span>
                      <span>{otpError}</span>
                    </div>
                  )}

                  {otpSuccessMessage && (
                    <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span>{otpSuccessMessage}</span>
                      </div>
                    </div>
                  )}

                  {!otpSent ? (
                    /* Step 1: Send OTP to Email */
                    <form onSubmit={handleSendLoginOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Work Email
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            required
                            value={otpEmail}
                            onChange={(e) => setOtpEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400 font-medium"
                            placeholder="name@company.com"
                            autoComplete="email"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5">
                          We will send a 6-digit verification code to this address.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={otpSending}
                        className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
                      >
                        {otpSending ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* Step 2: Enter OTP & Verify */
                    <form onSubmit={handleVerifyOtpLogin} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            6-Digit Verification Code
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSendLoginOtp()}
                            disabled={otpSending}
                            className="text-xs text-slate-500 hover:text-black font-semibold flex items-center gap-1 hover:underline"
                          >
                            <RefreshCw className={`w-3 h-3 ${otpSending ? 'animate-spin' : ''}`} />
                            Resend code
                          </button>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <KeyRound className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-lg tracking-widest font-mono text-center focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                            placeholder="123456"
                            autoFocus
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5">
                          Sent to <span className="font-semibold text-slate-700">{otpEmail}</span>.{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setOtpSent(false);
                              setOtpCode('');
                            }}
                            className="text-black font-bold underline ml-1"
                          >
                            Change email
                          </button>
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={otpLoading || otpCode.length < 6}
                        className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
                      >
                        {otpLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Verify & Sign In</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SIGN UP TAB (Unified Password & OTP) */}
          {authMode === 'signup' && (
            <div className="p-6 sm:p-8">
              {signupError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
                  <span className="text-sm">⚠️</span>
                  <span className="flex-1">{signupError}</span>
                </div>
              )}

              {signupOtpSuccessMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="flex-1">{signupOtpSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      First Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400 font-medium"
                        placeholder="John"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400 font-medium"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Work Email
                    </label>
                    {signupOtpSent && (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Code Sent
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full pl-9 pr-24 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400 font-medium"
                      placeholder="name@company.com"
                    />
                    <button
                      type="button"
                      disabled={signupOtpSending || signupResendCountdown > 0 || !signupEmail.includes('@')}
                      onClick={handleSendSignupOtp}
                      className="absolute inset-y-1 right-1 px-3 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40 disabled:hover:bg-slate-900"
                    >
                      {signupOtpSending ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : signupResendCountdown > 0 ? (
                        `${signupResendCountdown}s`
                      ) : signupOtpSent ? (
                        'Resend'
                      ) : (
                        'Get OTP'
                      )}
                    </button>
                  </div>
                </div>

                {/* Password & OTP in the same flow */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password (8+ chars)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400 font-medium"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      6-Digit OTP Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Key className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={signupOtp}
                        onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm tracking-widest font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-sans font-bold"
                        placeholder="123456"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-medium"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={signupLoading || (signupOtpSent && signupOtp.length < 6)}
                  className="w-full mt-3 py-3 px-4 rounded-xl text-sm font-bold text-white bg-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {signupLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : !signupOtpSent ? (
                    <>
                      <span>Send OTP & Continue Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Verify OTP & Auto-Login</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </>
                  )}
                </button>
              </form>

              {/* Organization link */}
              <div className="mt-5 text-center">
                <Link
                  to="/register"
                  className="text-xs text-slate-500 hover:text-black font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Register a New Company Organization &rarr;</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal (Interactive OTP Password Reset) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative">
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 mb-4">
              <KeyRound className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              {forgotStep === 1 && 'Reset Your Password'}
              {forgotStep === 2 && 'Verify Code & Set Password'}
              {forgotStep === 3 && 'Password Reset Complete'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {forgotStep === 1 && "Enter your work email address and we'll dispatch a 6-digit recovery code."}
              {forgotStep === 2 && `Enter the 6-digit code sent to ${forgotEmail} along with your new password.`}
              {forgotStep === 3 && 'Your account password has been safely updated. You can now sign in.'}
            </p>

            {forgotError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2">
                <span>⚠️</span>
                <span>{forgotError}</span>
              </div>
            )}

            {/* STEP 1: Enter email */}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotSendOtp} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400 font-medium"
                    placeholder="name@company.com"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-black hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {forgotLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Enter OTP & New Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleForgotResetPassword} className="mt-4 space-y-3.5">

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-base font-mono tracking-widest text-center focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                    placeholder="123456"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    New Password (8+ chars)
                  </label>
                  <div className="relative">
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      required
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full px-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400 font-medium"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                    >
                      {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400 font-medium"
                    placeholder="••••••••••••"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || forgotOtp.length < 6 || forgotNewPassword.length < 8}
                    className="px-4 py-2 text-xs font-bold text-white bg-black hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {forgotLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Update Password</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Success */}
            {forgotStep === 3 && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block text-sm text-emerald-900">Password Updated!</span>
                    <span>You can now sign in using your new password.</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    closeForgotModal();
                    setAuthMode('login');
                    setLoginMethod('password');
                    if (forgotEmail) setEmail(forgotEmail);
                  }}
                  className="w-full py-2.5 text-xs font-bold text-white bg-black hover:bg-slate-800 rounded-xl transition-all"
                >
                  Proceed to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
