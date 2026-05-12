import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  BarChart3, 
  ShieldCheck, 
  Activity, 
  Plus, 
  Loader2,
  AlertCircle,
  Megaphone,
  Eye,
  Globe,
  Settings
} from 'lucide-react';
import { collection, query, getDocs, addDoc, serverTimestamp, where, limit, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserRole, cn, UserProfile } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../contexts/AuthContext';
import AdminThemeSettings from '../components/AdminThemeSettings';

export default function AdminDashboard() {
  const { profile, setPreviewMode } = useAuth();
  const [counts, setCounts] = useState({ students: 0, announcements: 0, pending: 142 });
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'customization'>('overview');
  const [loading, setLoading] = useState(true);
  const [addingTest, setAddingTest] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    async function fetchData() {
      const isHardcodedAdmin = localStorage.getItem('adminEmail') === 'admin.bu.ac.th';
      
      if (!auth.currentUser && !isHardcodedAdmin) {
        return;
      }

      try {
        const studentsQuery = query(collection(db, 'users'), where('role', '==', UserRole.STUDENT));
        const studentsSnap = await getDocs(studentsQuery);
        const announcementsSnap = await getDocs(collection(db, 'announcements'));
        
        setCounts({
          students: studentsSnap.size,
          announcements: announcementsSnap.size,
          pending: studentsSnap.docs.filter(d => d.data().graduationStep === 4).length
        });
        
        setStudents(studentsSnap.docs.map(d => ({ ...d.data() } as UserProfile)).slice(0, 5));
        setSystemStatus('online');
      } catch (error) {
        console.error("Error fetching admin data:", error);
        setSystemStatus('offline');
        // Fallback for demo
        setCounts({ students: 1240, announcements: 42, pending: 12 });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [profile]);

  const handleUpdateGraduationStep = async (studentId: string, nextStep: number) => {
    try {
      const userRef = doc(db, 'users', studentId);
      await updateDoc(userRef, {
        graduationStep: nextStep,
        updatedAt: serverTimestamp()
      });
      setStudents(prev => prev.map(s => (s as any).id === studentId ? { ...s, graduationStep: nextStep } : s));
    } catch (error) {
      console.error("Error updating graduation status:", error);
    }
  };

  const handleAddTestData = async () => {
    setAddingTest(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: 'System Test Announcement',
        content: `This is an automated test entry created at ${new Date().toLocaleTimeString()}. The portal is now fully functional.`,
        category: 'Maintenance',
        date: serverTimestamp(),
        important: true
      });
      
      // Refresh counts
      const announcementsSnap = await getDocs(collection(db, 'announcements'));
      setCounts(prev => ({ ...prev, announcements: announcementsSnap.size }));
    } catch (error) {
      console.error("Error adding test data:", error);
      try {
        handleFirestoreError(error, OperationType.WRITE, 'announcements');
      } catch(e) {}
    } finally {
      setAddingTest(false);
    }
  };

  const handleStartPreview = () => {
    setPreviewMode(true);
    window.location.href = '/dashboard';
  };

  const stats = [
    { label: 'Total Students', value: counts.students, icon: Users, variant: 'blue' },
    { label: 'Announcements', value: counts.announcements, icon: Megaphone, variant: 'amber' },
    { label: 'System Status', value: systemStatus.toUpperCase(), icon: Activity, variant: systemStatus === 'online' ? 'emerald' : 'red' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Institutional Access</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">Admin HQ</h2>
          <p className="text-slate-500 font-bold tracking-tight">Managing academic lifecycles and infrastructure.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex p-1.5 glass rounded-3xl gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-2.5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2",
                activeTab === 'overview' ? "bg-brand-lime text-slate-900 shadow-lg shadow-brand-lime/20" : "text-slate-400 hover:text-slate-600"
              )}
            >
              System Overview
            </button>
            <button
              onClick={() => setActiveTab('customization')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-2.5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2",
                activeTab === 'customization' ? "bg-brand-lime text-slate-900 shadow-lg shadow-brand-lime/20" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Styling
            </button>
          </div>
          <div className="w-px h-10 bg-slate-200 hidden sm:block mx-2" />
          <button
            onClick={handleStartPreview}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 glass hover:bg-white text-slate-900 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest active:scale-95 shadow-sm"
          >
            <Eye className="w-4 h-4" />
            Live Preview
          </button>
        </div>
      </header>

      {activeTab === 'customization' ? (
        <AdminThemeSettings />
      ) : (
        <>
          {systemStatus === 'offline' && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider">Warning: Firebase Connection Interrupted</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="glass p-8 rounded-[40px] flex flex-col gap-6 group hover:shadow-2xl transition-all border-none">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${
                  stat.variant === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  stat.variant === 'amber' ? 'bg-amber-50 text-amber-600' :
                  stat.variant === 'red' ? 'bg-red-50 text-red-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  <stat.icon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter">
                    {loading && i < 2 ? <Loader2 className="w-8 h-8 animate-spin text-blue-500" /> : stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-brand-blue border border-blue-100 p-10 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
            <div className="text-center md:text-left relative z-10">
              <h4 className="font-black text-2xl text-slate-900 tracking-tight">Academic Content System</h4>
              <p className="text-slate-500 mt-2 font-bold max-w-md">Update portal schedules, exam phases, and global announcements from a central console.</p>
            </div>
            <Link to="/admin/manage" className="bg-slate-900 hover:bg-slate-800 text-white px-12 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-950/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap z-10">
              Manage Repository
            </Link>
          </div>

          <div className="glass p-8 rounded-[40px]">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Candidate Pipeline</h3>
              </div>
              <button className="text-[11px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-[0.2em] bg-blue-50 px-4 py-2 rounded-xl">View All Records</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-8 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Name</th>
                    <th className="pb-8 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Graduation Status</th>
                    <th className="pb-8 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Academic Progress</th>
                    <th className="pb-8 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((student: any) => (
                    <tr key={student.uid} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-8">
                        <div className="text-base font-black text-slate-900 mb-1">{student.displayName}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{student.studentId || student.major || 'Candidate'}</div>
                      </td>
                      <td className="py-8">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-2.5 w-28 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div 
                              className={cn(
                                "h-full transition-all duration-1000",
                                (student.graduationStep || 1) >= 4 ? 'bg-emerald-500' : 'bg-blue-600'
                              )} 
                              style={{ width: `${((student.graduationStep || 1) / 5) * 100}%` }}
                            />
                          </div>
                          <span className={cn(
                            "text-[10px] font-black tracking-widest uppercase",
                            (student.graduationStep || 1) === 4 ? "text-orange-600" : 
                            (student.graduationStep || 1) === 5 ? "text-emerald-600" :
                            "text-blue-600"
                          )}>
                            PHASE {student.graduationStep || 1}
                          </span>
                        </div>
                      </td>
                      <td className="py-8">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Thesis Maturity</div>
                        <div className="text-sm text-slate-900 font-black tracking-tight">{Math.round(((student.thesisProgress || 1) / 7) * 100)}% Verified</div>
                      </td>
                      <td className="py-8 text-right">
                        {(student.graduationStep || 1) === 3 ? (
                          <button 
                            onClick={() => handleUpdateGraduationStep(student.uid, 4)}
                            className="bg-brand-lime hover:bg-brand-lime/80 text-slate-900 px-6 py-3 rounded-2xl shadow-lg shadow-brand-lime/20 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95"
                          >
                            Verify Phase 4
                          </button>
                        ) : (student.graduationStep || 1) === 4 ? (
                          <button 
                            onClick={() => handleUpdateGraduationStep(student.uid, 5)}
                            className="bg-brand-lime hover:bg-brand-lime/80 text-slate-900 px-6 py-3 rounded-2xl shadow-lg shadow-brand-lime/20 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95"
                          >
                            Final Release
                          </button>
                        ) : (
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Draft</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-slate-500 italic font-medium">No student records found in current view.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
