import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { ClassSchedule, ComprehensiveExam } from '../lib/utils';
import { 
  Calendar as CalendarIcon, 
  FileText, 
  Loader2, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  UserCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval, 
  isToday 
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

import { handleFirestoreError, OperationType } from '../contexts/AuthContext';

export default function SchedulePage() {
  const { profile, isPreviewMode, previewDegreeLevel } = useAuth();
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [exams, setExams] = useState<ComprehensiveExam[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const currentDegreeLevel = isPreviewMode ? previewDegreeLevel : profile?.degreeLevel;

  useEffect(() => {
    const isHardcodedAdmin = localStorage.getItem('adminEmail') === 'admin.bu.ac.th';

    if (!profile && !isPreviewMode && !isHardcodedAdmin) return;
    
    // Only fetch if we have a real Firebase user to avoid permission-denied errors
    if (!auth.currentUser && !isHardcodedAdmin) {
      setLoading(false);
      return;
    }

    if (isHardcodedAdmin && !auth.currentUser) {
      // Mock data for bypass
      setClasses([
        { id: 'b1', subjectName: 'Advanced Data Intelligence', subjectCode: 'DI701', date: new Date().toISOString(), timeRange: '09:00 - 12:00', room: 'A3-401', target: 'Master\'s Degree' }
      ]);
      setLoading(false);
      return;
    }

    if (!currentDegreeLevel && !isPreviewMode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubClasses = onSnapshot(
      query(collection(db, 'class_schedules'), where('target', '==', currentDegreeLevel), orderBy('date', 'asc')),
      (snap) => {
        setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassSchedule)));
      },
      (error) => {
        console.warn('[DEBUG] Class schedule listener blocked. Falling back.');
        setClasses([]);
      }
    );

    const unsubExams = onSnapshot(
      query(collection(db, 'comprehensive_exams'), where('target', '==', currentDegreeLevel), orderBy('date', 'asc')),
      (snap) => {
        setExams(snap.docs.map(d => ({ id: d.id, ...d.data() } as ComprehensiveExam)));
        setLoading(false);
      },
      (error) => {
        console.warn('[DEBUG] Exam schedule listener blocked. Falling back.');
        setExams([]);
        setLoading(false);
      }
    );

    return () => { unsubClasses(); unsubExams(); };
  }, [currentDegreeLevel, profile, isPreviewMode]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
  }, [currentMonth]);

  const getEventsForDay = (day: Date) => {
    const dayClasses = classes.filter(c => isSameDay(new Date(c.date), day));
    const dayExams = exams.filter(e => isSameDay(new Date(e.date), day));
    return { dayClasses, dayExams };
  };

  const selectedEvents = useMemo(() => getEventsForDay(selectedDate), [selectedDate, classes, exams]);

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Academic Timeline</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">Board Schedule</h2>
          <p className="text-slate-500 font-bold tracking-tight">Monthly overview for your {currentDegreeLevel || "academic"} studies.</p>
        </div>
        
        <button 
          onClick={goToToday}
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-950/20"
        >
          Jump to Today
        </button>
      </header>

      {/* Calendar Section */}
      <div className="glass-morphism rounded-[40px] overflow-hidden border-none shadow-2xl">
        {/* Month Header */}
        <div className="p-8 bg-white/50 backdrop-blur-md border-b border-white/20 flex items-center justify-between">
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase tracking-widest">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-3 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200 shadow-sm transition-all duration-300">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={nextMonth} className="p-3 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200 shadow-sm transition-all duration-300">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-5 text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 bg-white">
          {calendarDays.map((day, idx) => {
            const { dayClasses, dayExams } = getEventsForDay(day);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDay = isToday(day);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative aspect-square sm:aspect-video flex flex-col items-center justify-center border-r border-b border-slate-50 p-2 transition-all hover:bg-slate-50 group",
                  !isCurrentMonth && "bg-slate-50/10 opacity-20",
                  isSelected && "bg-brand-blue/10"
                )}
              >
                <div className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-[14px] text-sm font-black transition-all relative z-10",
                  isTodayDay ? "bg-brand-lime text-slate-900 shadow-xl shadow-brand-lime/30 scale-105" : 
                  isSelected ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 group-hover:text-slate-900"
                )}>
                  {format(day, 'd')}
                </div>
                
                {/* Indicators */}
                <div className="absolute bottom-3 flex gap-1.5">
                  {dayClasses.length > 0 && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border-2 border-white" />
                  )}
                  {dayExams.length > 0 && (
                    <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)] border-2 border-white" />
                  )}
                </div>

                {isSelected && (
                  <motion.div 
                    layoutId="calendar-selection"
                    className="absolute inset-0 ring-2 ring-inset ring-slate-900/10 pointer-events-none"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details (Agenda) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[20px] bg-brand-blue flex items-center justify-center text-blue-600 shadow-lg shadow-brand-blue/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase tracking-widest leading-none">
                {isToday(selectedDate) ? "Today's Agenda" : format(selectedDate, 'EEEE, d MMM')}
              </h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                {selectedEvents.dayClasses.length + selectedEvents.dayExams.length} Scheduled Events
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {selectedEvents.dayClasses.length === 0 && selectedEvents.dayExams.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-12 text-center rounded-[40px] border-dashed border-white/10"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-600">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <p className="text-slate-500 italic font-medium">No academic events for this day.</p>
              </motion.div>
            ) : (
              <>
                {selectedEvents.dayClasses.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <ClassCard item={item} />
                  </motion.div>
                ))}
                {selectedEvents.dayExams.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <ExamCard item={item} />
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const ClassCard: React.FC<{ item: ClassSchedule }> = ({ item }) => {
  return (
    <div className="glass-morphism p-8 rounded-[40px] group hover:shadow-xl transition-all border-none relative overflow-hidden">
      <div className="absolute inset-0 bg-emerald-50 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity" />
      <div className="flex gap-8 relative z-10">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-110 transition-transform">
          <CalendarIcon className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h4 className="font-black text-slate-900 text-xl leading-tight truncate uppercase tracking-widest">{item.subjectName}</h4>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{item.subjectCode}</p>
            </div>
            <span className="bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200">
              LECTURE
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-[11px] font-black uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-2.5 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm"><Clock className="w-4 h-4 text-emerald-600" /> {item.timeRange}</span>
            <span className="flex items-center gap-2.5 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm"><MapPin className="w-4 h-4 text-emerald-600" /> {item.room}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExamCard: React.FC<{ item: ComprehensiveExam }> = ({ item }) => {
  return (
    <div className="glass-morphism p-8 rounded-[40px] group hover:shadow-xl transition-all border-none relative overflow-hidden">
      <div className="absolute inset-0 bg-orange-50 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity" />
      <div className="flex gap-8 relative z-10">
        <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 group-hover:scale-110 transition-transform">
          <FileText className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h4 className="font-black text-slate-900 text-xl leading-tight truncate uppercase tracking-widest">{item.title}</h4>
              <p className="text-sm text-slate-500 font-bold mt-2 leading-relaxed">{item.description}</p>
            </div>
            <span className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-orange-200">
              QUALIFYING
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-[11px] font-black uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-2.5 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm"><Clock className="w-4 h-4 text-orange-600" /> {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="flex items-center gap-2.5 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm"><MapPin className="w-4 h-4 text-orange-600" /> {item.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
