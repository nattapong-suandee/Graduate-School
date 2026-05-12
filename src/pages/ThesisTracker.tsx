import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, 
  Circle, 
  ChevronRight, 
  Info, 
  Save, 
  BookOpen, 
  PenTool, 
  Database, 
  BarChart3, 
  FileText, 
  Award,
  Loader2,
  Sparkles,
  Search
} from 'lucide-react';

const THESIS_STEPS = [
  {
    step: 1,
    title: 'กำหนดหัวข้อและหาอาจารย์ที่ปรึกษา',
    description: 'เริ่มต้นด้วยการค้นหาหัวข้อที่น่าสนใจและติดต่ออาจารย์ที่มีความเชี่ยวชาญในด้านนั้นเพื่อขอคำปรึกษาและตกลงเป็นที่ปรึกษาหลัก',
    icon: BookOpen
  },
  {
    step: 2,
    title: 'ทบทวนวรรณกรรม',
    description: 'ศึกษาและรวบรวมข้อมูลจากงานวิจัยที่เกี่ยวข้อง (Literature Review) เพื่อสร้างฐานข้อมูลและความเข้าใจในองค์ความรู้ปัจจุบัน',
    icon: Search
  },
  {
    step: 3,
    title: 'เขียนโครงร่างวิทยานิพนธ์',
    description: 'จัดทำข้อเสนอโครงการวิจัย (Proposal) ครอบคลุมบทที่ 1-3 (บทนำ, วรรณกรรมที่เกี่ยวข้อง, และระเบียบวิธีวิจัย)',
    icon: PenTool
  },
  {
    step: 4,
    title: 'เก็บรวบรวมข้อมูล',
    description: 'ดำเนินการเก็บข้อมูลตามแผนที่วางไว้ในระเบียบวิธีวิจัย ไม่ว่าจะเป็นการทดลอง การสำรวจ หรือการสัมภาษณ์',
    icon: Database
  },
  {
    step: 5,
    title: 'วิเคราะห์ข้อมูล',
    description: 'นำข้อมูลที่รวบรวมได้มาทำการประมวลผลและวิเคราะห์ด้วยเครื่องมือทางสถิติหรือวิธีการเชิงคุณภาพที่เหมาะสม',
    icon: BarChart3
  },
  {
    step: 6,
    title: 'เขียนวิทยานิพนธ์ฉบับสมบูรณ์',
    description: 'เรียบเรียงผลการวิจัยและสรุปผล ครอบคลุมทั้ง 5 บท เพื่อให้เป็นรูปเล่มที่สมบูรณ์ตามมาตรฐานทางวิชาการ',
    icon: FileText
  },
  {
    step: 7,
    title: 'สอบป้องกันและจัดทำเล่มสมบูรณ์',
    description: 'นำเสนองานวิจัยต่อคณะกรรมการสอบ (Thesis Defense) และดำเนินการแก้ไขปรับปรุงตามข้อเสนอแนะจนเสร็จสมบูรณ์',
    icon: Award
  }
];

// Components
export default function ThesisTracker() {
  const { user, profile, isPreviewMode } = useAuth();
  const [thesisTitle, setThesisTitle] = useState(profile?.thesisTitle || '');
  const [currentStep, setCurrentStep] = useState(profile?.thesisProgress || 1);
  const [saving, setSaving] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    if (profile) {
      setThesisTitle(profile.thesisTitle || '');
      setCurrentStep(profile.thesisProgress || 1);
    }
  }, [profile]);

  const handleUpdate = async () => {
    if (isPreviewMode) return;
    if (!user) return;

    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        thesisTitle,
        thesisProgress: Number(currentStep),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating thesis info:', error);
    } finally {
      setSaving(false);
    }
  };

  const progressPercentage = Math.round((currentStep / 7) * 100);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Academic Journey</span>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">Thesis Tracker</h2>
        <p className="text-slate-500 font-bold tracking-tight">Track and record your academic thesis progress through 7 key milestones.</p>
      </header>

      {/* Header Info Card */}
      <div className="glass-morphism p-10 relative overflow-hidden group border-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-blue blur-[100px] -mr-40 -mt-40" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="flex-1 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Thesis Title</label>
                <input
                  type="text"
                  value={thesisTitle}
                  onChange={(e) => setThesisTitle(e.target.value)}
                  placeholder="Enter your research topic..."
                  disabled={isPreviewMode}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all text-xl tracking-tight"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Milestone</label>
                  <select
                    value={currentStep}
                    onChange={(e) => setCurrentStep(Number(e.target.value))}
                    disabled={isPreviewMode}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all appearance-none cursor-pointer text-sm"
                  >
                    {THESIS_STEPS.map(s => (
                      <option key={s.step} value={s.step} className="bg-white">Milestone {s.step}: {s.title}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={handleUpdate}
                    disabled={saving || isPreviewMode}
                    className="w-full h-[62px] bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-slate-950/20 flex items-center justify-center gap-3 group active:scale-95 uppercase tracking-widest text-[11px]"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    <span>Sync Progress</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-8 bg-brand-lime rounded-[40px] shadow-xl shadow-brand-lime/20 min-w-[180px] text-center rotate-1">
              <div className="relative w-28 h-28 flex items-center justify-center -rotate-1">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    className="text-white/30"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={301.6}
                    strokeDashoffset={301.6 - (301.6 * progressPercentage) / 100}
                    strokeLinecap="round"
                    className="text-slate-900 transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900 leading-none">{progressPercentage}%</span>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mt-4 opacity-70">Project Maturity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {THESIS_STEPS.map((step, index) => {
          const isCompleted = currentStep > step.step;
          const isActive = currentStep === step.step;
          const isFuture = currentStep < step.step;
          const isLast = index === THESIS_STEPS.length - 1;
          const isExpanded = expandedStep === step.step;

          return (
            <div key={step.step} className="flex gap-6 group">
              {/* Vertical line and dot */}
              <div className="flex flex-col items-center">
                <div 
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500",
                    isCompleted && "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20",
                    isActive && "bg-brand-lime border-brand-lime text-slate-900 shadow-xl shadow-brand-lime/30 scale-110 ring-4 ring-brand-lime/10",
                    isFuture && "bg-white border-slate-100 text-slate-300"
                  )}
                >
                  {isCompleted ? <CheckCircle className="w-6 h-6" /> : <step.icon className="w-5 h-5" />}
                </div>
                {!isLast && (
                  <div className={cn(
                    "w-1 flex-1 min-h-[50px] my-3 transition-colors duration-500 rounded-full",
                    isCompleted ? "bg-emerald-100" : "bg-slate-100"
                  )} />
                )}
              </div>

              {/* Content Card */}
              <button 
                onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                className={cn(
                  "flex-1 text-left glass-morphism p-8 transition-all duration-300 hover:shadow-xl relative overflow-hidden group/card border-none",
                  isActive && "bg-brand-lime/5 ring-2 ring-brand-lime shadow-xl",
                  isFuture && "opacity-60 grayscale-[0.5]"
                )}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 p-4">
                    <Sparkles className="w-5 h-5 text-brand-lime filter drop-shadow-[0_0_8px_rgba(226,255,59,0.8)] animate-pulse" />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em]",
                        isCompleted ? "text-emerald-600" : isActive ? "text-slate-900" : "text-slate-400"
                      )}>
                        Phase {step.step}
                      </span>
                      {isActive && (
                        <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                          Current Focus
                        </span>
                      )}
                    </div>
                    <h4 className={cn(
                      "text-xl font-black tracking-tighter transition-colors",
                      isCompleted ? "text-slate-400" : "text-slate-900"
                    )}>
                      {step.title}
                    </h4>
                  </div>
                  <ChevronRight className={cn(
                    "w-6 h-6 text-slate-300 transition-transform duration-300 group-hover/card:translate-x-1",
                    isExpanded && "rotate-90 text-slate-900"
                  )} />
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-6 mt-6 border-t border-slate-100">
                        <p className="text-slate-500 text-sm leading-relaxed font-bold">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
