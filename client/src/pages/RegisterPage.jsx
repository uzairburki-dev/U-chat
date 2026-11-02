import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  User,
  Lock,
  Mail,
  ArrowRight,
  RefreshCw,
  Loader2,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80'
];

export const RegisterPage = ({ onNavigateToLogin, initialEmail = '', initialStep = 'form' }) => {
  const { register, verifyEmail, resendOtp } = useAuth();

  const [step, setStep] = useState(initialStep); // 'form' | 'verify'
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('Hey there! I am using ChatBoat.');
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]);

  // OTP Verification state
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Timer countdown for resending OTP
  useEffect(() => {
    let timer;
    if (step === 'verify' && resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    } else if (resendCooldown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, resendCooldown]);

  const handleRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !email.trim() || !password || submitting) return;

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setError('');
      setSuccessMsg('');
      setSubmitting(true);

      const result = await register({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
        bio: bio.trim(),
        avatar
      });

      if (result?.requireVerification) {
        setStep('verify');
        if (result.devOtp) setDevOtpHint(result.devOtp);
        setResendCooldown(60);
        setCanResend(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6 || submitting) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    try {
      setError('');
      setSuccessMsg('');
      setSubmitting(true);

      await verifyEmail({
        email: email.trim().toLowerCase(),
        otp: otp.trim()
      });
      // AuthContext will update user and automatically navigate to dashboard
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || submitting) return;

    try {
      setError('');
      setSuccessMsg('');
      setSubmitting(true);

      const res = await resendOtp({ email: email.trim().toLowerCase() });
      setSuccessMsg('A new verification code has been sent to your email.');
      if (res?.devOtp) setDevOtpHint(res.devOtp);

      setResendCooldown(60);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-brand-50/40 to-slate-200 dark:from-[#0b0f19] dark:via-slate-900 dark:to-[#0f172a] select-none">
      <div className="w-full max-w-4xl grid md:grid-cols-5 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Left Visual Brand Panel */}
        <div className="md:col-span-2 p-8 bg-gradient-to-br from-indigo-600 via-brand-600 to-purple-700 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex p-3 rounded-2xl bg-white/20 backdrop-blur-md shadow-lg">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">ChatBoat</h1>
            <p className="text-xs text-brand-100 leading-relaxed">
              Real-time messaging, group management, and privacy-first communications.
            </p>
          </div>

          <div className="relative z-10 py-6 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Email verification & verified accounts</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Message requests & group invitation approvals</span>
            </div>
          </div>

          <div className="relative z-10 text-[11px] text-white/70">
            Secure • Privacy-First • Modern Real-Time
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-3 p-8 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto space-y-5">
            {step === 'form' ? (
              <>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Create an Account
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Fill in the details below. We'll send an OTP to verify your email.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 animate-slide-up flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {/* Avatar Selector */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <Avatar src={avatar} name={fullName || 'Avatar'} size="sm" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Your Avatar
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {AVATAR_OPTIONS.map((opt, i) => (
                        <img
                          key={i}
                          src={opt}
                          alt="Option"
                          onClick={() => setAvatar(opt)}
                          className={`w-6 h-6 rounded-full object-cover cursor-pointer transition-transform ${
                            avatar === opt ? 'ring-2 ring-brand-500 scale-110' : 'opacity-70'
                          }`}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={handleRandomAvatar}
                        className="p-1 text-slate-400 hover:text-brand-500 transition-colors"
                        title="Generate bot avatar"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Jordan Smith"
                        required
                        className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:outline-none text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Username & Email in 2 columns */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="jordan"
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:outline-none text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jordan@example.com"
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:outline-none text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Password (min. 6 characters) *
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:outline-none text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 mt-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Continue to Verification</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </div>
              </>
            ) : (
              /* Step 2: Email OTP Verification Screen */
              <div className="space-y-4 animate-fade-in">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-inner">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Verify Your Email
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    We sent a 6-digit code to{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>.
                    Please enter it below to activate your account.
                  </p>
                </div>

                {devOtpHint && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-center text-xs text-amber-700 dark:text-amber-300">
                    💡 Development Code: <strong className="tracking-widest font-mono text-sm ml-1">{devOtpHint}</strong>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleVerifySubmit} className="space-y-4">
                  <div>
                    <label className="block text-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full py-3 text-center tracking-[0.5em] font-mono text-2xl font-bold bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:outline-none text-slate-800 dark:text-slate-100"
                      autoFocus
                    />
                    <p className="text-[10px] text-center text-slate-400 mt-1">
                      Code is valid for 10 minutes
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={otp.length !== 6 || submitting}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Complete Registration</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                  >
                    ← Edit Details
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!canResend || submitting}
                    className={`font-semibold flex items-center gap-1 ${
                      canResend
                        ? 'text-brand-600 dark:text-brand-400 hover:underline cursor-pointer'
                        : 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{canResend ? 'Resend Code' : `Resend in ${resendCooldown}s`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
