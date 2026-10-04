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
  Eye,
  EyeOff,
  User,
  Briefcase,
  Sparkles,
  LogIn,
  UserPlus,
  ShieldCheck,
  Building
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
        serverMsg || 'Invalid email or password. If you do not have an account yet, please click Sign Up.'
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
              Workforce Intelligence
            </span>
          </div>
        </Link>

        <h2 className="mt-6 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {authMode === 'login' ? 'Sign in to Workspace' : 'Create an Account'}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          {authMode === 'login'
            ? 'Access your company telemetry, app analytics, and employee status'
            : 'Get started with HighP privacy-safe workspace activity monitor'}
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
              {loginError && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
                  <span className="text-sm">⚠️</span>
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-slate-500 hover:text-black transition-colors font-medium"
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

              {/* Demo Sign In Helper */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
                  Quick Access Profiles
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('shamsaifudheen@gmail.com');
                      setPassword('Password@123');
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-black bg-slate-50 hover:bg-white text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span>Admin / HR</span>
                      <span className="text-[10px] text-slate-500 font-normal">Syam</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                      shamsaifudheen@gmail.com
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail('highphaus@gmail.com');
                      setPassword('Password@123');
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-black bg-slate-50 hover:bg-white text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span>Employee</span>
                      <span className="text-[10px] text-slate-500 font-normal">Staff</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                      highphaus@gmail.com
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SIGN UP TAB */}
          {authMode === 'signup' && (
            <div className="p-6 sm:p-8">
              {signupError && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
                  <span className="text-sm">⚠️</span>
                  <span>{signupError}</span>
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400 font-medium"
                      placeholder="name@company.com"
                    />
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
                      placeholder="••••••••••••"
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

                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {signupLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Employee Account</span>
                      <ArrowRight className="w-4 h-4" />
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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 mb-4">
              <KeyRound className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-slate-900">Reset Your Password</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter your work email address and we'll send password recovery instructions.
            </p>

            {forgotSuccess ? (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password reset link dispatched! Please check your inbox.</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="mt-4 space-y-3">
                {forgotError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                    {forgotError}
                  </div>
                )}
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400 font-medium"
                  placeholder="name@company.com"
                />
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-black hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
