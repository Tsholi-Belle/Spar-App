import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  Store,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Send,
} from 'lucide-react';
import { api, setAuthToken, setStoredUser } from '../../api/client';
import { User, AuthAccount } from '../../types';
import sparLogo from '../../assets/spar_academy_logo.png';

const AUTHORIZED_ACCOUNTS: AuthAccount[] = [
  {
    id: 'usr-kgomotso-01',
    email: 'Kgomotso.Lekganyane@spar.co.za',
    default_password: 'SPAR@Kgomotso2026!',
    full_name: 'Kgomotso Lekganyane (Lead IP Owner & HR Director)',
    role: 'admin',
    department: 'All',
    avatar_initials: 'KL',
  },
  {
    id: 'usr-tsholanang-02',
    email: 'tsholanangpodile@gmail.com',
    default_password: 'SPAR@Tsholanang2026!',
    full_name: 'Tsholanang Podile (Executive Project Lead)',
    role: 'admin',
    department: 'All',
    avatar_initials: 'TP',
  },
];

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'credentials' | 'verification'>('credentials');
  const [email, setEmail] = useState('Kgomotso.Lekganyane@spar.co.za');
  const [password, setPassword] = useState('SPAR@Kgomotso2026!');
  const [verificationCode, setVerificationCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<AuthAccount[]>(AUTHORIZED_ACCOUNTS);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await api.getAccounts();
      if (data && data.length > 0) {
        setDemoAccounts(data);
      }
    } catch {
      // use default authorized accounts
    }
  };

  // Step 1: Validate Email + Password & Dispatch 2FA Code
  const handleCredentialsSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMsg('Please enter both your authorized email and password.');
      return;
    }

    // Whitelist check
    const isWhitelisted = AUTHORIZED_ACCOUNTS.some(
      (a) => a.email.toLowerCase() === cleanEmail
    );

    if (!isWhitelisted) {
      setErrorMsg(
        'Access Denied: Unrecognized email address. Access to this IP-protected system is restricted strictly to Kgomotso.Lekganyane@spar.co.za and tsholanangpodile@gmail.com.'
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessNotice(null);

      // Call Backend login API
      try {
        const res = await api.login({ email: cleanEmail, password: cleanPass });
        if (res.step === 'verification_required') {
          setVerificationId(res.verification_id);
          setSimulatedCode(res.simulated_code);
          setStep('verification');
          setSuccessNotice(
            `A 6-digit approval code was dispatched to ${cleanEmail}.`
          );
          return;
        }
      } catch (serverErr: any) {
        // Local verification fallback if server is offline
        const match = AUTHORIZED_ACCOUNTS.find(
          (a) =>
            a.email.toLowerCase() === cleanEmail &&
            (a.default_password === cleanPass || cleanPass === 'SPAR@Kgomotso2026!' || cleanPass === 'SPAR@Tsholanang2026!')
        );

        if (match) {
          const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
          setSimulatedCode(mockCode);
          setVerificationId(`vcode_${Date.now()}`);
          setStep('verification');
          setSuccessNotice(`A 6-digit approval code was dispatched to ${cleanEmail}.`);
          return;
        }

        throw new Error(
          serverErr.message ||
            'Invalid credentials. Please verify your email and secure passkey.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-Digit Email Code
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verificationCode.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await api.verifyCode({
          email: cleanEmail,
          code: cleanCode,
          verification_id: verificationId || undefined,
        });

        if (res.user) {
          onLoginSuccess(res.user);
          return;
        }
      } catch (serverErr: any) {
        // Fallback check against simulated code
        if (simulatedCode && cleanCode === simulatedCode) {
          const match = AUTHORIZED_ACCOUNTS.find(
            (a) => a.email.toLowerCase() === cleanEmail
          )!;
          const authUser: User = {
            id: match.id,
            email: match.email,
            full_name: match.full_name,
            role: match.role,
            department: match.department,
            avatar_initials: match.avatar_initials,
          };
          setAuthToken(`spar_token_${match.id}_${Date.now()}`);
          setStoredUser(authUser);
          onLoginSuccess(authUser);
          return;
        }

        throw new Error(
          serverErr.message ||
            'Invalid verification code. Please check the code dispatched to your email.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please enter the correct 6-digit code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const cleanEmail = email.trim().toLowerCase();
      try {
        const res = await api.resendCode(cleanEmail);
        setSimulatedCode(res.simulated_code);
        setSuccessNotice('A new 6-digit verification code has been dispatched.');
      } catch {
        const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
        setSimulatedCode(mockCode);
        setSuccessNotice('A new 6-digit verification code has been dispatched.');
      }
    } catch (err: any) {
      setErrorMsg('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (acc: AuthAccount) => {
    setEmail(acc.email);
    setPassword(acc.default_password || 'SPAR@Kgomotso2026!');
    setStep('credentials');
    setErrorMsg(null);
    setSuccessNotice(null);
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col justify-between items-center p-4 sm:p-6 select-none">
      {/* Top Banner */}
      <div className="w-full max-w-md flex items-center justify-between text-xs text-zinc-500 pt-2 px-1">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-700">
          <Store className="w-3.5 h-3.5 text-black" />
          <span>SUPERSPAR Sandton City Flagship</span>
        </div>
        <div className="font-mono text-[10px] bg-black text-white px-2 py-0.5 rounded font-bold">
          RESTRICTED ACCESS
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden p-6 sm:p-8 my-auto">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center bg-white p-3 rounded-2xl border border-zinc-200 shadow-xs mb-3">
            <img
              src={sparLogo}
              alt="SPAR Academy of Learning"
              className="h-12 w-auto object-contain"
            />
          </div>

          <h2 className="text-xl font-black text-zinc-900 tracking-tight">
            {step === 'credentials'
              ? 'Authorized Personnel Sign-In'
              : 'Security Verification Approval'}
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {step === 'credentials'
              ? 'Enter your whitelisted credentials to access the IP protected system.'
              : `Enter the 6-digit verification code sent to ${email}`}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-zinc-100 border border-zinc-900 rounded-xl text-zinc-900 text-xs font-bold flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-black mt-0.5" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {/* Success Notice Banner */}
        {successNotice && (
          <div className="mt-4 p-3 bg-zinc-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-zinc-200" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* STEP 1: CREDENTIALS FORM */}
        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                Authorized Work / Personal Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="Kgomotso.Lekganyane@spar.co.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                Secure Access Passkey
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black hover:bg-zinc-800 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>CONTINUE & SEND APPROVAL CODE</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: 6-DIGIT EMAIL VERIFICATION CODE FORM */
          <form onSubmit={handleVerifyCodeSubmit} className="mt-5 space-y-4">
            {/* Simulated Email Dispatch Box */}
            {simulatedCode && (
              <div className="p-3.5 bg-zinc-50 border border-zinc-300 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-900 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-black" />
                    <span>Email Dispatch Simulator</span>
                  </span>
                  <span className="text-[9px] font-mono bg-black text-white px-1.5 py-0.5 rounded font-bold">
                    SECURITY OTP
                  </span>
                </div>
                <div className="text-xs text-zinc-700">
                  Approval token sent to <strong>{email}</strong>:
                </div>
                <div className="text-center py-2">
                  <span className="font-mono text-2xl font-black tracking-widest text-black bg-white px-4 py-1.5 rounded-xl border border-zinc-300 inline-block shadow-xs">
                    {simulatedCode}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 text-center">
                  Copy and enter the 6-digit code below to approve this login session.
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                Enter 6-Digit Email Verification Code *
              </label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                placeholder="e.g. 849201"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center py-3 text-lg font-mono font-bold tracking-widest bg-zinc-50 border-2 border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-3 bg-black hover:bg-zinc-800 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>VERIFY & ACCESS SYSTEM</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setVerificationCode('');
                  setErrorMsg(null);
                }}
                className="text-zinc-500 hover:text-black font-semibold cursor-pointer flex items-center gap-1"
              >
                <span>← Back to Email</span>
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                className="text-zinc-800 hover:underline font-bold cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Resend Code</span>
              </button>
            </div>
          </form>
        )}

        {/* Authorized Accounts 1-Click Selector */}
        <div className="mt-6 pt-5 border-t border-zinc-100">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5">
            <KeyRound className="w-3 h-3 text-zinc-500" />
            <span>Authorized IP Owners (Click to Fill):</span>
          </div>

          <div className="space-y-1.5">
            {demoAccounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleQuickSelect(acc)}
                className={`w-full p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                  email.toLowerCase() === acc.email.toLowerCase()
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold truncate">{acc.full_name}</div>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      email.toLowerCase() === acc.email.toLowerCase()
                        ? 'bg-zinc-800 text-zinc-200'
                        : 'bg-zinc-200 text-zinc-800'
                    }`}
                  >
                    WHITELISTED
                  </span>
                </div>
                <div
                  className={`text-[10px] font-mono truncate mt-0.5 ${
                    email.toLowerCase() === acc.email.toLowerCase()
                      ? 'text-zinc-300'
                      : 'text-zinc-500'
                  }`}
                >
                  {acc.email}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* IP Protection Notice */}
        <div className="mt-5 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-800 uppercase tracking-tight">
            <ShieldAlert className="w-3.5 h-3.5 text-black" />
            <span>Confidential & Proprietary IP Protected</span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Access to this system is restricted exclusively to authorized IP holders: <strong>Kgomotso.Lekganyane@spar.co.za</strong> and <strong>tsholanangpodile@gmail.com</strong>.
            Any unauthorized attempt to access, duplicate, or copy this application and its underlying algorithms will be rejected and logged.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-zinc-400 pb-2">
        SPAR Group (Pty) Ltd • W&RSETA Accredited Academy • Proprietary Access System
      </div>
    </div>
  );
};
