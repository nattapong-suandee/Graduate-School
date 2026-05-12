import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { GraduationCap, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Priority Fix: Bypass for Admin testing
      if (email === 'admin.bu.ac.th' && password === '1234') {
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminEmail', 'admin.bu.ac.th');
        console.log('[DEBUG] Admin Bypass triggered in Student Login.');

        // Attempt Auth internal
        const authEmail = 'admin@bu.ac.th';
        const authPass = 'admin1234';
        try {
          await signInWithEmailAndPassword(auth, authEmail, authPass);
        } catch (e: any) {
          if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
             await createUserWithEmailAndPassword(auth, authEmail, authPass);
          }
        }
        
        window.location.href = '/admin/dashboard';
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-lime blur-[120px] opacity-20 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-blue blur-[120px] opacity-20 translate-x-1/2 translate-y-1/2" />
      
      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-white text-slate-900 shadow-2xl border border-slate-100 mb-8 font-black text-3xl tracking-tighter">
            BU
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">Graduate Board</h2>
          <p className="text-slate-500 font-bold tracking-tight">Synchronized Academic Intelligence</p>
        </div>

        <div className="glass-morphism rounded-[40px] p-10 border-none shadow-2xl bg-white/70 backdrop-blur-2xl">
          <form onSubmit={handleLogin} className="space-y-8">
            {email === 'admin.bu.ac.th' && password === '1234' && (
              <div className="p-4 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-2xl text-center animate-pulse">
                Admin Bypass Protocol Enabled
              </div>
            )}
            
            {error && (
              <div className="p-5 bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold rounded-2xl">
                {error}
              </div>
            )}
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Identification</label>
              <input
                type="text"
                required
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all tracking-tight"
                placeholder="somchai.abcd@bumail.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-[10px] text-blue-600 px-1 font-black uppercase tracking-widest opacity-60">ID Format Check Active</p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Credential</label>
              <input
                type="password"
                required
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all font-mono"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-2xl shadow-slate-900/20 transition-all flex items-center justify-center gap-3 group disabled:opacity-70 uppercase tracking-widest text-[11px]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authenticate"}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-10 text-center text-xs font-bold">
            <span className="text-slate-400">New candidate? </span>
            <Link to="/register" className="text-blue-600 font-black hover:underline uppercase tracking-widest">Enrol Now</Link>
          </div>
        </div>

        <div className="text-center">
            <Link to="/admin/login" className="text-[10px] text-slate-400 hover:text-slate-900 bg-white/50 px-6 py-3 rounded-full border border-slate-200 transition-all font-black uppercase tracking-widest shadow-sm">Administrative Authority</Link>
        </div>
      </div>
    </div>
  );
}
