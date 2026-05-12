import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, Lock, User } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Priority Fix: Bypass for Admin testing
      if (email === 'admin.bu.ac.th' && password === '1234') {
        console.log('[DEBUG] Admin Bypass matched. Authenticating with internal admin account...');
        
        // Use a valid email format for Firebase Auth internally
        const authEmail = 'admin@bu.ac.th';
        const authPass = 'admin1234'; // Consistent dummy password for this environment

        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminEmail', 'admin.bu.ac.th');

        try {
          // 1. Try to sign in first
          await signInWithEmailAndPassword(auth, authEmail, authPass);
        } catch (signInErr: any) {
          // 2. If it doesn't exist, create it (Auto-Provisioning Auth)
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
            console.log('[DEBUG] Admin auth not found, creating new entry...');
            await createUserWithEmailAndPassword(auth, authEmail, authPass);
          } else {
            throw signInErr;
          }
        }
        
        console.log('[DEBUG] Login Success: Redirecting to Admin Dashboard.');
        window.location.href = '/admin/dashboard';
      } else {
        throw new Error('Invalid Admin Credentials');
      }
    } catch (err: any) {
      console.error('[DEBUG] Admin Login Error:', err.message);
      setError(err.message || 'Access Denied');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-blue blur-[150px] opacity-10 rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-lime blur-[150px] opacity-10 rounded-full" />
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-slate-900 text-white shadow-2xl mb-8 transform hover:-rotate-3 transition-transform duration-500">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">Authority Terminal</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Institutional Management Interface</p>
        </div>

        <div className="glass-morphism bg-white rounded-[48px] p-12 border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] backdrop-blur-2xl">
          <form onSubmit={handleLogin} className="space-y-8">
            {email === 'admin.bu.ac.th' && password === '1234' && (
              <div className="p-4 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl text-center animate-pulse">
                Admin Bypass Protocol: Secure Link Established
              </div>
            )}
            
            {error && (
              <div className="p-5 bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold rounded-2xl flex items-center gap-4 animate-in fade-in zoom-in duration-300">
                <AlertCircle className="w-6 h-6 shrink-0 opacity-50" />
                <span className="font-black uppercase tracking-widest">{error}</span>
              </div>
            )}
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Admin Designation</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-5 text-slate-900 font-black placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all tracking-tight"
                  placeholder="admin.bu.ac.th"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Master Access Key</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-14 py-5 text-slate-900 font-black placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all font-mono"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-300 hover:text-slate-900 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-6 rounded-2xl transition-all shadow-2xl shadow-slate-950/20 flex items-center justify-center gap-4 group disabled:opacity-70 disabled:cursor-not-allowed mt-6 uppercase tracking-widest text-[11px] border border-slate-900"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>Initialize Terminal</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-slate-50 text-center">
            <Link to="/login" className="text-slate-400 hover:text-slate-900 transition-all font-black text-[11px] uppercase tracking-widest inline-flex items-center gap-2 group">
              <span className="border-b-2 border-transparent group-hover:border-slate-900 transition-all">Student Portal Sync</span>
            </Link>
          </div>
        </div>
        
        <p className="text-center mt-12 text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">
          Restricted Area • BU Graduate IT Services
        </p>
      </div>
    </div>
  );
}
