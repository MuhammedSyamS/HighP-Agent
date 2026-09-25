import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../lib/authContext';
import {
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  X,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Briefcase,
  Sparkles,
  LogIn,
  UserPlus
} from 'lucide-react';
import { UserRole } from '@highp/shared';

type AuthMode = 'login' | 'signup';

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
  const { login, signup } = useAuth();

  // Mode: login or signup
  const isSignup = location.pathname === '/signup';
  const [authMode, setAuthMode] = useState<AuthMode>(isSignup ? 'signup' : 'login');

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Sign Up state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [department, setDepartment] = useState('Engineering & Development');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = email.trim();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setLoginError('Please enter a complete email address including domain (e.g. name@company.com).');
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
        serverMsg || 'Invalid email or password. If you do not have an account yet, please click the Sign Up tab.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

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

    setSignupLoading(true);

    try {
      await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        password: signupPassword,
        department
      });
      // Direct successful signup to the SaaS workspace
      navigate('/employee');
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.errors?.map((item: any) => item.message).join(', ') ||
        err.response?.data?.message ||
        err.message;
      setSignupError(
        serverMsg || 'Unable to create account. Please try again or check if email is already registered.'
      );
    } finally {
      setSignupLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail) {
      setForgotError('Please enter your work email address.');
      return;
    }

    setForgotLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setForgotSuccess(true);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to dispatch reset email. Please contact administrator.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotSuccess(false);
    setForgotError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-3 group transition-transform hover:scale-105">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-xl shadow-xl shadow-indigo-500/25">
            H
          </div>
          <div className="text-left">
            <span className="font-extrabold text-2xl tracking-tight text-white block">
              HIGHPHAUS
            </span>
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
              Workspace Platform
            </span>
          </div>
        </Link>
        <h2 className="mt-5 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {authMode === 'login' ? 'Welcome Back' : 'Get Started with HighP'}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
          {authMode === 'login'
            ? 'Sign in to access your dashboard, track activity, and collaborate'
            : 'Sign up for your workspace account and start using the platform'}
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 border border-slate-800/80 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-xl">
          {/* Main Auth Mode Tabs: Sign In vs Sign Up */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-950/60 border-b border-slate-800/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLoginError('');
              }}
              className={`py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 ${
                authMode === 'login'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setSignupError('');
              }}
              className={`py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 ${
                authMode === 'signup'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Sign Up
            </button>
          </div>

          {/* SIGN IN TAB */}
          {authMode === 'login' && (
            <div className="p-6 sm:p-8">
              {loginError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-start gap-2.5">
                  <span className="text-sm">⚠️</span>
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 font-medium"
                      placeholder="name@company.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setShowForgotModal(true);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 font-medium"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500/20"
                    />
                    Remember me on this device
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('alex@highphaus.com');
                      setPassword('Password@123');
                      setLoginError('');
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                  >
                    ⚡ Fill sample login
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full mt-2 flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-600/30 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none transition-all disabled:opacity-50 hover:scale-[1.01]"
                >
                  {loginLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
                <span>Don't have an account yet? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setSignupError('');
                  }}
                  className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Sign Up now
                </button>
              </div>
            </div>
          )}

          {/* SIGN UP TAB */}
          {authMode === 'signup' && (
            <div className="p-6 sm:p-8">
              {signupError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-start gap-2.5">
                  <span className="text-sm">⚠️</span>
                  <span>{signupError}</span>
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      First Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                      placeholder="john.doe@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept} className="bg-slate-900 text-white">
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password (min. 8 characters)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full mt-3 flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-600/30 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none transition-all disabled:opacity-50 hover:scale-[1.01]"
                >
                  {signupLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLoginError('');
                  }}
                  className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* Footer inside card */}
          <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>HighP SaaS Platform</span>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              type="button"
              onClick={closeForgotModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {forgotSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Reset Link Dispatched</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                  If an account exists for <strong className="text-white">{forgotEmail}</strong>, password recovery instructions have been dispatched.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
                  >
                    Return to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Reset Password</h3>
                    <p className="text-[11px] text-slate-400">Enter your email to receive recovery instructions</p>
                  </div>
                </div>

                {forgotError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                    {forgotError}
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Your Work Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Check your inbox for a password reset link after submitting.
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeForgotModal}
                      className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                      {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
