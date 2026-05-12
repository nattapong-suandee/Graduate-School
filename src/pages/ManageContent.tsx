import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { Announcement, ClassSchedule, ComprehensiveExam, DegreeLevel, cn } from '../lib/utils';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Megaphone, 
  FileText, 
  X, 
  Loader2, 
  Edit3,
  Clock,
  MapPin,
  ClipboardList
} from 'lucide-react';

type TabType = 'news' | 'classes' | 'exams';

export default function ManagePortal() {
  const [activeTab, setActiveTab] = useState<TabType>('news');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Data states
  const [news, setNews] = useState<Announcement[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [exams, setExams] = useState<ComprehensiveExam[]>([]);

  // Form states
  const [newsForm, setNewsForm] = useState({ title: '', content: '', category: 'General' as any });
  const [scheduleForm, setScheduleForm] = useState({ 
    subjectName: '', subjectCode: '', date: '', timeRange: '', room: '', target: DegreeLevel.MASTER 
  });
  const [examForm, setExamForm] = useState({ 
    title: '', description: '', date: '', location: '', target: DegreeLevel.MASTER 
  });

  useEffect(() => {
    setLoading(true);
    const unsubNews = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snap) => {
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    });
    const unsubClasses = onSnapshot(query(collection(db, 'class_schedules'), orderBy('date', 'asc')), (snap) => {
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassSchedule)));
    });
    const unsubExams = onSnapshot(query(collection(db, 'comprehensive_exams'), orderBy('date', 'asc')), (snap) => {
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() } as ComprehensiveExam)));
      setLoading(false);
    });

    return () => { unsubNews(); unsubClasses(); unsubExams(); };
  }, []);

  const resetForms = () => {
    setNewsForm({ title: '', content: '', category: 'General' });
    setScheduleForm({ subjectName: '', subjectCode: '', date: '', timeRange: '', room: '', target: DegreeLevel.MASTER });
    setExamForm({ title: '', description: '', date: '', location: '', target: DegreeLevel.MASTER });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let data: any = {};
      let collectionName = '';

      if (activeTab === 'news') {
        data = { ...newsForm, createdAt: serverTimestamp() };
        collectionName = 'announcements';
      } else if (activeTab === 'classes') {
        data = { ...scheduleForm, createdAt: serverTimestamp() };
        collectionName = 'class_schedules';
      } else {
        data = { ...examForm, createdAt: serverTimestamp() };
        collectionName = 'comprehensive_exams';
      }

      if (editingId) {
        await updateDoc(doc(db, collectionName, editingId), data);
      } else {
        await addDoc(collection(db, collectionName), data);
      }
      
      setShowModal(false);
      resetForms();
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const collectionName = activeTab === 'news' ? 'announcements' : activeTab === 'classes' ? 'class_schedules' : 'comprehensive_exams';
    await deleteDoc(doc(db, collectionName, id));
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    if (activeTab === 'news') setNewsForm({ title: item.title, content: item.content, category: item.category });
    else if (activeTab === 'classes') setScheduleForm({ ...item });
    else setExamForm({ ...item });
    setShowModal(true);
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">Administrative Terminal</h2>
          <p className="text-slate-500 font-bold tracking-tight">Control the university's digital surface.</p>
        </div>
        <button
          onClick={() => { resetForms(); setShowModal(true); }}
          className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-slate-950/20 transition-all active:scale-95 border border-slate-900"
        >
          <Plus className="w-5 h-5" />
          Register {activeTab === 'news' ? 'Article' : activeTab === 'classes' ? 'Session' : 'Assessment'}
        </button>
      </header>

      <div className="flex p-1.5 glass-morphism rounded-2xl gap-1.5 border-none shadow-sm bg-slate-50">
        {[
          { id: 'news', label: 'News Feed', icon: Megaphone },
          { id: 'classes', label: 'Class Schedules', icon: Calendar },
          { id: 'exams', label: 'Comprehensive Exams', icon: ClipboardList }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
              activeTab === tab.id 
                ? "bg-white text-slate-900 shadow-xl shadow-slate-900/5 border border-slate-100" 
                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {activeTab === 'news' && news.map(item => (
            <div key={item.id} className="glass-morphism p-8 rounded-[40px] flex items-center justify-between border-none group bg-white hover:shadow-2xl transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
              <div className="flex items-center gap-6 overflow-hidden relative z-10">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                  <Megaphone className="w-8 h-8" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white">{item.category}</span>
                    <h4 className="font-black text-slate-900 text-lg uppercase tracking-widest leading-none truncate">{item.title}</h4>
                  </div>
                  <p className="text-sm text-slate-500 font-bold leading-relaxed truncate max-w-md">{item.content}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all relative z-10">
                <button onClick={() => startEdit(item)} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 border border-slate-100 hover:border-blue-100 shadow-sm transition-all"><Edit3 className="w-5 h-5" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-50 rounded-xl text-slate-400 hover:text-red-500 border border-slate-100 hover:border-red-100 shadow-sm transition-all"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          ))}

          {activeTab === 'classes' && schedules.map(item => (
            <div key={item.id} className="glass-morphism p-8 rounded-[40px] flex items-center justify-between border-none group bg-white hover:shadow-2xl transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white">{item.target}</span>
                    <h4 className="font-black text-slate-900 text-lg uppercase tracking-widest leading-none">{item.subjectName}</h4>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">[{item.subjectCode}]</span>
                  </div>
                  <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><Clock className="w-4 h-4 text-emerald-600" /> {item.timeRange}</span>
                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><MapPin className="w-4 h-4 text-emerald-600" /> {item.room}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all relative z-10">
                <button onClick={() => startEdit(item)} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 border border-slate-100 hover:border-blue-100 shadow-sm transition-all"><Edit3 className="w-5 h-5" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-50 rounded-xl text-slate-400 hover:text-red-500 border border-slate-100 hover:border-red-100 shadow-sm transition-all"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          ))}

          {activeTab === 'exams' && exams.map(item => (
            <div key={item.id} className="glass-morphism p-8 rounded-[40px] flex items-center justify-between border-none group bg-white hover:shadow-2xl transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-orange-50 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 shadow-sm">
                  <ClipboardList className="w-8 h-8" />
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-orange-500 text-white">{item.target}</span>
                    <h4 className="font-black text-slate-900 text-lg uppercase tracking-widest leading-none">{item.title}</h4>
                  </div>
                  <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><Calendar className="w-4 h-4 text-orange-600" /> {new Date(item.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><MapPin className="w-4 h-4 text-orange-600" /> {item.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all relative z-10">
                <button onClick={() => startEdit(item)} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 border border-slate-100 hover:border-blue-100 shadow-sm transition-all"><Edit3 className="w-5 h-5" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-50 rounded-xl text-slate-400 hover:text-red-500 border border-slate-100 hover:border-red-100 shadow-sm transition-all"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          ))}

          {((activeTab === 'news' && news.length === 0) || 
            (activeTab === 'classes' && schedules.length === 0) || 
            (activeTab === 'exams' && exams.length === 0)) && (
            <div className="text-center py-24 bg-white/50 backdrop-blur-md rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-8 text-slate-300 border border-slate-100 shadow-inner">
                {activeTab === 'news' ? <Megaphone className="w-10 h-10" /> : activeTab === 'classes' ? <Calendar className="w-10 h-10" /> : <ClipboardList className="w-10 h-10" />}
              </div>
              <p className="text-slate-400 font-black uppercase tracking-[0.25em] text-[10px]">No Content Inventory</p>
              <p className="text-slate-500 font-bold mt-2 max-w-[300px]">The database is currently empty for this category. Initialize new records above.</p>
            </div>
          )}
        </div>
      )}

      {/* Creation/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
          <div className="bg-white w-full max-w-2xl rounded-[40px] p-12 border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors">
              <X className="w-10 h-10" />
            </button>
            
            <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-widest">{editingId ? 'Edit' : 'Create'} {activeTab === 'news' ? 'Authority News' : activeTab === 'classes' ? 'Learning Session' : 'Exam Schedule'}</h3>
            <p className="text-slate-500 font-bold mb-12">Fill in the institutional details below to synchronize with student portals.</p>

            <form onSubmit={handleSubmit} className="space-y-8">
              {activeTab === 'news' && (
                <>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">News Headline</label>
                    <input required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all tracking-tight" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Content</label>
                    <textarea required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all min-h-[180px] leading-relaxed" value={newsForm.content} onChange={e => setNewsForm({...newsForm, content: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Information Category</label>
                    <div className="grid grid-cols-3 gap-4">
                      {['General', 'Thesis', 'Event'].map(cat => (
                        <button key={cat} type="button" onClick={() => setNewsForm({...newsForm, category: cat as any})} className={cn("py-4 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all", newsForm.category === cat ? "bg-slate-900 border-slate-900 text-white shadow-xl" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100")}>{cat}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'classes' && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Nomenclature</label>
                      <input required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all" value={scheduleForm.subjectName} onChange={e => setScheduleForm({...scheduleForm, subjectName: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catalog Code</label>
                      <input required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all font-mono" value={scheduleForm.subjectCode} onChange={e => setScheduleForm({...scheduleForm, subjectCode: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Degree</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[DegreeLevel.MASTER, DegreeLevel.DOCTORAL].map(lv => (
                          <button key={lv} type="button" onClick={() => setScheduleForm({...scheduleForm, target: lv})} className={cn("py-4 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all", scheduleForm.target === lv ? "bg-slate-900 border-slate-900 text-white shadow-xl" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100")}>{lv}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Date</label>
                      <input type="date" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:outline-none h-[66px]" value={scheduleForm.date} onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time Allocations</label>
                      <input required placeholder="09:00 - 12:00" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:outline-none" value={scheduleForm.timeRange} onChange={e => setScheduleForm({...scheduleForm, timeRange: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Infrastructure / Room</label>
                      <input required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:outline-none" value={scheduleForm.room} onChange={e => setScheduleForm({...scheduleForm, room: e.target.value})} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'exams' && (
                <>
                   <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assessment Designation</label>
                    <input required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:outline-none" value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Examination Parameters</label>
                    <textarea className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:outline-none min-h-[120px] leading-relaxed" value={examForm.description} onChange={e => setExamForm({...examForm, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Degree Requirement</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[DegreeLevel.MASTER, DegreeLevel.DOCTORAL].map(lv => (
                          <button key={lv} type="button" onClick={() => setExamForm({...examForm, target: lv})} className={cn("py-4 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all", examForm.target === lv ? "bg-orange-500 border-orange-500 text-white shadow-xl" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100")}>{lv}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Synchronous Time</label>
                      <input type="datetime-local" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:outline-none h-[66px]" value={examForm.date.split('Z')[0]} onChange={e => setExamForm({...examForm, date: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical / Virtual Latitude</label>
                    <input required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:outline-none" value={examForm.location} onChange={e => setExamForm({...examForm, location: e.target.value})} />
                  </div>
                </>
              )}

              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-6 rounded-[24px] shadow-2xl transition-all active:scale-95 mt-10 uppercase tracking-[0.2em] text-[11px] border border-slate-900">
                Synchronize Records
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
