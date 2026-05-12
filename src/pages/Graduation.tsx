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
  ExternalLink, 
  Library, 
  ClipboardCheck, 
  Clock, 
  Award,
  Wallet,
  Building2,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';

const GRADUATION_STEPS = [
  {
    step: 1,
    title: 'ตรวจสอบคุณสมบัติ',
    description: 'ตรวจสอบความพร้อมเบื้องต้น เช่น หน่วยกิตครบถ้วน, GPAX >= 3.00 และผ่านการสอบวิทยานิพนธ์/ประมวลความรู้',
    icon: ClipboardCheck,
    checklist: [
      'GPAX >= 3.00',
      'หน่วยกิตครบตามหลักสูตร',
      'ผ่านการสอบวัดความรู้ภาษาอังกฤษ',
      'ผ่านการสอบวิทยานิพนธ์ / ประมวลความรู้'
    ]
  },
  {
    step: 2,
    title: 'ยื่นคำร้องขอสำเร็จการศึกษา',
    description: 'บันทึกข้อมูลและยื่นคำร้องผ่านระบบ URSA Online ของมหาวิทยาลัยในช่วงเวลาที่กำหนด',
    icon: FileText,
    action: {
      label: 'Link to URSA System',
      url: 'https://ursa.bu.ac.th'
    }
  },
  {
    step: 3,
    title: 'เคลียร์ภาระหนี้สิน',
    description: 'ตรวจสอบและชำระค่าธรรมเนียมต่างๆ รวมถึงคืนหนังสือห้องสมุดและเคลียร์ภาระผูกพันกับหน่วยงานในมหาวิทยาลัย',
    icon: Wallet
  },
  {
    step: 4,
    title: 'รอสภามหาวิทยาลัยอนุมัติ',
    description: 'รอการตรวจสอบขั้นสุดท้ายและอนุมัติปริญญาจากสภามหาวิทยาลัย (ขั้นตอนนี้เฉพาะเจ้าหน้าที่สามารถอัปเดตสถานะให้ได้)',
    icon: Building2,
    adminOnly: true
  },
  {
    step: 5,
    title: 'รับหลักฐานการศึกษา',
    description: 'รับใบรับรองการสำเร็จการศึกษา (Certificate of Graduation) และใบแสดงผลการเรียน (Transcript) ฉบับสมบูรณ์',
    icon: Award,
    adminOnly: true
  }
];

export default function GraduationPage() {
  const { user, profile, isPreviewMode } = useAuth();
  const [currentStep, setCurrentStep] = useState(profile?.graduationStep || 1);
  const [saving, setSaving] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    if (profile?.graduationStep) {
      setCurrentStep(profile.graduationStep);
    }
  }, [profile]);

  const handleUpdateStep = async (step: number) => {
    if (isPreviewMode) return;
    if (!user) return;
    
    // Students can only update up to step 3
    if (step > 3) return;

    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        graduationStep: step,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating graduation step:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStepStatus = (stepNumber: number) => {
    if (profile?.graduationStep && profile.graduationStep > stepNumber) return 'completed';
    if (profile?.graduationStep === stepNumber) {
      if (stepNumber === 4) return 'waiting';
      return 'active';
    }
    return 'pending';
  };

  const currentStatusText = () => {
    const step = profile?.graduationStep || 1;
    if (step === 1) return 'Checking Eligibility';
    if (step === 2) return 'Ready for Application';
    if (step === 3) return 'Clearing Obligations';
    if (step === 4) return 'Waiting for Council Approval';
    if (step === 5) return 'Completed - Ready to Graduate';
    return 'Roadmap Initialized';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <Award className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Road to Graduation</span>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">Final Clearance</h2>
        <p className="text-slate-500 font-bold tracking-tight">Navigate your final steps towards academic completion.</p>
      </header>

      {/* Summary Card */}
      <div className="glass-morphism p-10 relative overflow-hidden group border-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-blue blur-[100px] -mr-40 -mt-40 opacity-20" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Milestone</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4 leading-none uppercase tracking-widest">
              {currentStatusText()}
              {(profile?.graduationStep || 1) === 4 && (
                <span className="w-4 h-4 rounded-full bg-orange-500 animate-pulse ring-4 ring-orange-500/10" />
              )}
            </h3>
          </div>
          <div className="flex -space-x-3">
            {[1, 2, 3, 4, 5].map((s) => {
              const status = getStepStatus(s);
              return (
                <div 
                  key={s}
                  className={cn(
                    "w-12 h-12 rounded-2xl border-4 border-white flex items-center justify-center text-sm font-black transition-all duration-500 shadow-xl",
                    status === 'completed' ? "bg-emerald-500 text-white translate-y-[-4px]" : 
                    status === 'active' ? "bg-slate-900 text-white scale-110 z-10 translate-y-[-8px]" :
                    status === 'waiting' ? "bg-orange-500 text-white translate-y-[-4px]" :
                    "bg-slate-100 text-slate-400"
                  )}
                >
                  {status === 'completed' ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {GRADUATION_STEPS.map((step, index) => {
          const status = getStepStatus(step.step);
          const isLast = index === GRADUATION_STEPS.length - 1;
          const isExpanded = expandedStep === step.step;
          const isCompleted = status === 'completed';
          const isActive = status === 'active';
          const isWaiting = status === 'waiting';

          return (
            <div key={step.step} className="flex gap-6">
              {/* Vertical line and dot */}
              <div className="flex flex-col items-center">
                <div 
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500",
                    isCompleted && "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20",
                    isActive && "bg-brand-lime border-brand-lime text-slate-900 shadow-xl shadow-brand-lime/30 scale-110",
                    isWaiting && "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20",
                    status === 'pending' && "bg-white border-slate-100 text-slate-300"
                  )}
                >
                  <step.icon className={cn("w-7 h-7", isActive && "filter drop-shadow-sm")} />
                </div>
                {!isLast && (
                  <div className={cn(
                    "w-1 flex-1 min-h-[60px] my-4 transition-colors duration-500 rounded-full",
                    isCompleted ? "bg-emerald-100" : "bg-slate-100"
                  )} />
                )}
              </div>

              {/* Content Card */}
              <div className={cn(
                "flex-1 glass-morphism p-10 transition-all duration-500 relative overflow-hidden group/card border-none hover:shadow-2xl",
                isActive && "bg-brand-lime/5 ring-4 ring-brand-lime shadow-2xl scale-[1.02] z-10",
                isWaiting && "border-orange-500/30 bg-orange-500/5 ring-2 ring-orange-500/20",
                status === 'pending' && "opacity-60 grayscale-[0.5]"
              )}>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] block mb-3",
                      isCompleted ? "text-emerald-600" : 
                      isActive ? "text-slate-900" :
                      isWaiting ? "text-orange-600" :
                      "text-slate-400"
                    )}>
                      Phase {step.step} {isCompleted && ' - MISSION ACCOMPLISHED'} {isWaiting && ' - Pending Review'}
                    </span>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase tracking-widest">{step.title}</h4>
                  </div>
                  <button 
                    onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                    className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"
                  >
                    <ChevronRight className={cn("w-6 h-6 text-slate-400 transition-transform duration-300", isExpanded && "rotate-90 text-slate-900")} />
                  </button>
                </div>

                <p className="text-slate-500 text-sm font-bold mb-8 leading-relaxed max-w-2xl">
                  {step.description}
                </p>

                {/* Step specific content */}
                {step.checklist && (
                  <div className="bg-slate-50 rounded-[32px] p-8 mb-8 space-y-4 border border-slate-100">
                    {step.checklist.map((item, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {step.action && (
                  <a 
                    href={step.action.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all mb-8 shadow-xl shadow-slate-950/20 active:scale-95 group/btn"
                  >
                    {step.action.label}
                    <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                  </a>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-8 mt-4">
                  {step.adminOnly ? (
                    <div className="flex items-center gap-3 text-orange-600 font-bold italic text-[11px] uppercase tracking-widest">
                      <Clock className="w-4 h-4 animate-spin-slow" />
                      Requires Secondary Verification
                    </div>
                  ) : isActive ? (
                    <button
                      onClick={() => handleUpdateStep(step.step + 1)}
                      disabled={saving || isPreviewMode}
                      className="bg-brand-lime text-slate-900 px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-brand-lime/30 flex items-center gap-3 active:scale-95 border border-brand-lime"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Sync Completion
                    </button>
                  ) : isCompleted ? (
                    <div className="flex items-center gap-3 text-emerald-600 text-[11px] font-black uppercase tracking-widest">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      Verified
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-300 font-black uppercase tracking-widest flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-slate-200" />
                      Awaiting Pre-requisites
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Notice */}
      <div className="bg-brand-blue/10 border border-brand-blue/20 p-10 rounded-[40px] flex gap-6">
        <AlertCircle className="w-8 h-8 text-blue-600 shrink-0" />
        <div>
          <h4 className="font-black text-slate-900 text-lg tracking-tight uppercase tracking-widest mb-2">Important Notice</h4>
          <p className="text-slate-500 font-bold leading-relaxed">
            The graduation process may take 1-3 months after final examination. Please ensure all contact information in your profile is up to date to receive notifications regarding ceremony details.
          </p>
        </div>
      </div>
    </div>
  );
}
