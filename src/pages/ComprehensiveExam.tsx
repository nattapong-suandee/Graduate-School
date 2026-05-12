import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { ComprehensiveExam } from '../lib/utils';
import { 
  ClipboardCheck, 
  FileText, 
  Loader2, 
  Clock, 
  MapPin, 
  Info,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function ComprehensiveExamPage() {
  const { profile, isPreviewMode, previewDegreeLevel } = useAuth();
  const [exams, setExams] = useState<ComprehensiveExam[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentDegreeLevel = isPreviewMode ? previewDegreeLevel : profile?.degreeLevel;

  useEffect(() => {
    const isHardcodedAdmin = localStorage.getItem('adminEmail') === 'admin.bu.ac.th';

    if (!profile && !isPreviewMode && !isHardcodedAdmin) return;
    
    if (!auth.currentUser && !isHardcodedAdmin) {
      setLoading(false);
      return;
    }

    if (isHardcodedAdmin && !auth.currentUser) {
      // Mock data for bypass
      setExams([
        { 
            id: 'e1', 
            title: 'Qualifying Examination Phase I', 
            description: 'Core concepts examination for doctoral candidates.',
            date: new Date(Date.now() + 86400000 * 7).toISOString(), 
            location: 'Main Hall', 
            target: 'Doctoral Degree' 
        }
      ]);
      setLoading(false);
      return;
    }

    if (!currentDegreeLevel && !isPreviewMode) {
      setLoading(false);
      return;
    }

    const unsubExams = onSnapshot(
      query(collection(db, 'comprehensive_exams'), where('target', '==', currentDegreeLevel), orderBy('date', 'asc')),
      (snap) => {
        setExams(snap.docs.map(d => ({ id: d.id, ...d.data() } as ComprehensiveExam)));
        setLoading(false);
      },
      (error) => {
        console.warn('[DEBUG] Exam schedule listener blocked.');
        setExams([]);
        setLoading(false);
      }
    );

    return () => unsubExams();
  }, [currentDegreeLevel, profile, isPreviewMode]);

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <ClipboardCheck className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Academic Milestone</span>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">Board Evaluation</h2>
        <p className="text-slate-500 font-bold tracking-tight">Requirement tracking and exam schedule for your {currentDegreeLevel}.</p>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-morphism p-10 relative overflow-hidden group border-none">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500 blur-[80px] -mr-24 -mt-24 group-hover:opacity-100 transition-all opacity-30" />
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter uppercase tracking-widest">Eligibility</h3>
            <div className="flex items-center gap-3 text-emerald-600 mb-8">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-black text-sm uppercase tracking-widest">Status: Ready to Apply</span>
            </div>
            <p className="text-slate-500 font-bold mb-8 leading-relaxed text-sm">
              You have met all the necessary credit and GPA benchmarks to sit for the upcoming evaluation phase.
            </p>
            <button className="w-full bg-brand-lime text-slate-900 font-black py-5 rounded-[24px] hover:bg-brand-lime/80 transition-all shadow-xl shadow-brand-lime/20 active:scale-95 uppercase tracking-widest text-[11px] border border-brand-lime">
              Begin Registration
            </button>
          </div>
        </div>

        <div className="glass-morphism p-10 relative overflow-hidden group border-none">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 blur-[80px] -mr-24 -mt-24 group-hover:opacity-100 transition-all opacity-20" />
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tighter uppercase tracking-widest">Benchmarks</h3>
            <div className="space-y-5">
              {[
                { label: 'Minimum Credits Earned', value: 'Completed', status: 'done' },
                { label: 'Cumulative GPA ≥ 3.00', value: '3.85', status: 'done' },
                { label: 'Language Proficiency', status: 'done' },
              ].map((req, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{req.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-900 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">{req.value || 'Verified'}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Exams List */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase tracking-widest">Upcoming Board Schedule</h3>
        </div>

        <div className="space-y-4">
          {exams.length === 0 ? (
            <div className="glass-morphism p-16 text-center rounded-[40px] border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-6 text-slate-300 border border-slate-100">
                <AlertCircle className="w-8 h-8" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No evaluations scheduled yet for your level.</p>
            </div>
          ) : (
            exams.map(exam => (
              <div key={exam.id} className="glass-morphism p-8 group hover:shadow-2xl transition-all border-none relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-blue/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex gap-8 relative z-10">
                    <div className="w-16 h-16 rounded-3xl bg-brand-blue text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-sm group-hover:scale-110 transition-transform">
                        <FileText className="w-8 h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h4 className="font-black text-slate-900 text-xl leading-tight truncate uppercase tracking-widest">{exam.title}</h4>
                                <p className="text-xs text-slate-400 font-black mt-1 uppercase tracking-[0.2em]">{format(new Date(exam.date), 'EEEE, d MMMM yyyy')}</p>
                            </div>
                            <span className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {exam.target.includes('Doctoral') ? 'PHD LEVEL' : 'MASTER LEVEL'}
                            </span>
                        </div>
                        <p className="text-slate-500 font-bold text-sm mb-6 leading-relaxed max-w-2xl">{exam.description}</p>
                        <div className="flex flex-wrap items-center gap-6 text-[11px] font-black uppercase tracking-widest text-slate-600">
                            <span className="flex items-center gap-2.5 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                                <Clock className="w-4 h-4 text-blue-600" /> 
                                {new Date(exam.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="flex items-center gap-2.5 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                                <MapPin className="w-4 h-4 text-blue-600" /> 
                                {exam.location}
                            </span>
                        </div>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Helpful Resources */}
      <div className="bg-brand-lime/10 border border-brand-lime/20 p-10 rounded-[40px] flex flex-col sm:flex-row items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-brand-lime flex items-center justify-center shadow-lg shadow-brand-lime/20 text-slate-900 border border-brand-lime">
          <Info className="w-7 h-7" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h4 className="font-black text-slate-900 text-lg tracking-tight">Academic Resources</h4>
          <p className="text-slate-500 font-bold">Download study guides, previous board questions, and preparation checklists.</p>
        </div>
        <button className="bg-slate-900 text-white font-black px-10 py-4 rounded-2xl hover:bg-slate-800 transition-all font-black text-[11px] uppercase tracking-widest whitespace-nowrap shadow-xl shadow-slate-950/20">
          View Archive
        </button>
      </div>
    </div>
  );
}
