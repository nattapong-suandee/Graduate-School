import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Announcement } from '../lib/utils';
import { LogOut, BookOpen, Clock, CheckCircle, GraduationCap, Megaphone, Bell, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

import { handleFirestoreError, OperationType } from '../contexts/AuthContext';

export default function StudentDashboard() {
  const { user, profile, isPreviewMode, previewDegreeLevel, signOut } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const currentDegreeLevel = isPreviewMode ? previewDegreeLevel : profile?.degreeLevel;
  const currentName = isPreviewMode ? 'Preview User' : (profile?.displayName?.split(' ')[0] || 'Student');

  useEffect(() => {
    // Check if we have a real Firebase user to avoid permission-denied errors
    // If we're in the hardcoded admin bypass without a real user yet, show mock data
    const isHardcodedAdmin = localStorage.getItem('adminEmail') === 'admin.bu.ac.th';

    if (!auth.currentUser && !isHardcodedAdmin) {
      setLoading(false);
      return;
    }

    if (isHardcodedAdmin && !auth.currentUser) {
      // Provide mock data for hardcoded admin bypass
      setAnnouncements([
        { id: '1', title: 'System Maintenance', content: 'Academic systems will be updated this weekend.', category: 'General', createdAt: { seconds: Date.now()/1000 } as any },
        { id: '2', title: 'Thesis Submission Open', content: 'Students can now upload their final documentation.', category: 'Thesis', createdAt: { seconds: Date.now()/1000 - 86400 } as any }
      ]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
      setLoading(false);
    }, (error) => {
      console.warn('[DEBUG] Announcement listener blocked by rules. Falling back to mock data.');
      // If permission fails, we might be in a transient state or bypass
      setAnnouncements([
        { id: 'm1', title: 'Institutional Update', content: 'Please review the latest thesis guidelines in the downloads section.', category: 'General', createdAt: { seconds: Date.now()/1000 } as any }
      ]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]); // Add user to dependency to re-run when auth stabilizes

  const stats = [
    { label: 'Degree Progress', value: '75%', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Thesis Step', value: 'Seminar II', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Status', value: 'Active', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <GraduationCap className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{currentDegreeLevel} Candidate</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1">Sawadee, {currentName}!</h2>
          <p className="text-slate-500 font-bold tracking-tight">Your academic journey is 75% complete.</p>
        </div>
      </header>

      {/* Landscape Banner */}
      <div className="relative w-full aspect-[21/9] rounded-[40px] overflow-hidden glass-morphism border-white/10 group">
        <img 
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=2070&auto=format&fit=crop" 
          alt="Academic Collaboration" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent flex flex-col justify-end p-8">
          <div className="animate-in fade-in slide-in-from-left-4 duration-1000 delay-300 max-w-2xl">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2">Graduate Affairs & Research</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Empowering Academic Excellence</h3>
            <p className="text-slate-600 font-bold leading-relaxed">Collaborate with advisors and peers to accelerate your research output and thesis milestones.</p>
          </div>
        </div>
      </div>

      {/* Announcements Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-white tracking-tight text-lg">Announcements</h3>
          </div>
          <button className="text-xs font-bold text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors">
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {announcements.map(news => (
               <div key={news.id} className="glass-morphism p-8 group hover:bg-white transition-all duration-500">
                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-brand-blue flex items-center justify-center shrink-0 border border-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                     <Bell className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                        news.category === 'Thesis' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {news.category}
                      </span>
                      <h4 className="font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors uppercase tracking-widest text-sm">{news.title}</h4>
                    </div>
                    <p className="text-slate-500 line-clamp-2 leading-relaxed font-bold text-sm">{news.content}</p>
                    <p className="text-[10px] text-slate-400 mt-4 font-black uppercase tracking-[0.2em]">
                      {new Date(news.createdAt?.seconds * 1000).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="glass p-12 text-center rounded-[32px] border-dashed border-white/10 flex flex-col items-center justify-center gap-4">
                <Bell className="w-8 h-8 text-slate-800" />
                <p className="text-slate-500 italic font-medium">No announcements published yet.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-morphism p-8 flex items-center gap-6 hover:shadow-2xl transition-all group duration-500 border-none">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-morphism p-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-brand-blue flex items-center justify-center border border-blue-100 shadow-sm shadow-blue-500/5">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Academic Progress</h3>
          </div>
          <div className="space-y-6">
            {[
              { task: 'Seminar I Proposal', done: true },
              { task: 'Seminar II Draft', done: true },
              { task: 'Seminar III Final', done: false },
              { task: 'Comprehensive Exam', done: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-5 group cursor-help">
                <div className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                  item.done ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "border-slate-200 text-transparent"
                )}>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className={cn(
                  "text-base font-bold transition-all duration-300",
                  item.done ? "text-slate-400 line-through" : "text-slate-800 group-hover:translate-x-1"
                )}>{item.task}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-morphism p-12 relative overflow-hidden group border-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-lime blur-[100px] -mr-32 -mt-32 group-hover:bg-brand-lime/50 transition-all duration-1000" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-brand-lime text-slate-900 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6 border border-brand-lime shadow-sm">
               Milestone Target
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter leading-tight">Final Thesis Submission</h3>
            <p className="text-slate-500 font-bold mb-10 leading-relaxed max-w-sm">Upload your cleared documentation and finalize your academic achievement today.</p>
            <button className="w-full bg-slate-900 text-white font-black py-5 rounded-[24px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-950/20 active:scale-95 uppercase tracking-widest text-[11px]">
              Open Submission Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
