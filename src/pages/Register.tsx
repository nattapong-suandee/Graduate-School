import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { validateBUEmail, UserRole, DegreeLevel, cn } from '../lib/utils';
import { GraduationCap, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [degreeLevel, setDegreeLevel] = useState<DegreeLevel>(DegreeLevel.MASTER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validate BU email format
    if (!validateBUEmail(email)) {
      setError('Invalid email format. Must be [name].[4chars]@bumail.net (e.g., somchai.abcd@bumail.net)');
      return;
    }

    setLoading(true);

    try {
      // 2. Create Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Create Firestore profile
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        displayName: name,
        role: UserRole.STUDENT,
        degreeLevel: degreeLevel,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-lime blur-[120px] opacity-20 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-blue blur-[120px] opacity-20 -translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-white text-slate-900 shadow-2xl border border-slate-100 mb-8 font-black text-3xl tracking-tighter">
            BU
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">Candidate Enrolment</h2>
          <p className="text-slate-500 font-bold tracking-tight">Join the synchronized academic ecosystem.</p>
        </div>

        <div className="glass-morphism rounded-[40px] p-10 border-none shadow-2xl bg-white/70 backdrop-blur-2xl">
          <form onSubmit={handleRegister} className="space-y-8">
            {error && (
              <div className="p-5 bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold rounded-2xl flex items-start gap-4">
                <AlertCircle className="w-6 h-6 shrink-0 opacity-50" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Designation (Full Name)</label>
              <input
                type="text"
                required
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all tracking-tight"
                placeholder="Somchai K."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Level Target</label>
              <div className="grid grid-cols-2 gap-4">
                {[DegreeLevel.MASTER, DegreeLevel.DOCTORAL].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDegreeLevel(level)}
                    className={cn(
                      "py-4 rounded-xl border transition-all font-black text-[10px] uppercase tracking-widest",
                      degreeLevel === level 
                        ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10" 
                        : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Identifier (Email)</label>
              <input
                type="email"
                required
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all tracking-tight"
                placeholder="somchai.abcd@bumail.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-[10px] text-blue-600 px-1 font-black uppercase tracking-widest opacity-60">Validation Pattern Active</p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Seal (Password)</label>
              <input
                type="password"
                required
                minLength={6}
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Enrolment"}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-10 text-center text-xs font-bold">
            <span className="text-slate-400">Already registered? </span>
            <Link to="/login" className="text-blue-600 font-black hover:underline uppercase tracking-widest">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
