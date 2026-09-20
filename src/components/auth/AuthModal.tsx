import React, { useEffect, useState } from 'react';
import { ShieldCheck, Mail, Lock, LogIn, UserPlus, X, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  reauthenticationRequired?: boolean;
  onAuthenticated?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, reauthenticationRequired = false, onAuthenticated }) => {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest, logOut } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setError(null);
    }
    if (reauthenticationRequired) setMode('signin');
  }, [isOpen, reauthenticationRequired]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const res = await signInWithGoogle();
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setPassword('');
      onAuthenticated?.();
      onClose();
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    const res = mode === 'signin' ? await signInWithEmail(email, password) : await signUpWithEmail(email, password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setPassword('');
      onAuthenticated?.();
      onClose();
    }
  };

  const handleGuestSession = async () => {
    setError(null);
    setLoading(true);
    const res = await signInAsGuest();
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setPassword('');
      onAuthenticated?.();
      onClose();
    }
  };

  const handleSignOut = async () => {
    setError(null);
    setLoading(true);
    const result = await logOut();
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onAuthenticated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">AIM Account & Security</h2>
            <p className="text-xs text-slate-400">Private, isolated Life Operating System workspace</p>
          </div>
        </div>

        {reauthenticationRequired && (
          <p role="alert" className="mb-4 text-sm text-amber-300">Your session could not be verified. Sign in again to continue.</p>
        )}
        {user && !reauthenticationRequired && error && (
          <p role="alert" className="mb-4 text-sm text-rose-300">{error}</p>
        )}
        {user && !reauthenticationRequired ? (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                {user.email ? user.email.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-white truncate">
                    {user.displayName || (user.isAnonymous ? 'Guest Account' : user.email?.split('@')[0])}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">{user.email || 'Anonymous session'}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">UID: {user.uid.substring(0, 12)}...</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-2">
              <div className="flex items-center space-x-2 text-slate-300 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Isolated Cloud Storage Enabled</span>
              </div>
              <p>
                Your goals, projects, schedule, reflections, and operating context are securely stored under your isolated Firebase UID.
              </p>
            </div>

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 font-semibold text-sm transition-all"
            >
              {loading ? 'Signing out...' : 'Sign Out of Account'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                  mode === 'signin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                  mode === 'signup' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-rose-400 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-white font-medium text-sm flex items-center justify-center space-x-3 transition-all hover:bg-slate-800/40"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.3-6.7-5.3L1.6 15.9C3.5 19.8 7.4 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-800"></div>
              <span className="absolute bg-slate-900 px-3 text-[11px] text-slate-500 font-medium">OR USE EMAIL</span>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {mode === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Isolated Account'}</span>
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleGuestSession}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center justify-center space-x-2 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Try as Private Guest Session</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
