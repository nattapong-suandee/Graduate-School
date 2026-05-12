import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  User, 
  Mail, 
  GraduationCap, 
  Calendar, 
  Shield, 
  UserCircle, 
  Save, 
  Loader2, 
  CheckCircle2,
  BookOpen,
  Hash,
  Camera,
  Upload,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, DegreeLevel, UserProfile, compressImage, OperationType, handleFirestoreError } from '../lib/utils';

export default function Profile() {
  const { profile, user, loading: authLoading, isPreviewMode, previewDegreeLevel, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Authentication Check & Redirect
  useEffect(() => {
    if (!authLoading && !user && !isPreviewMode) {
      navigate('/login');
    }
  }, [user, authLoading, navigate, isPreviewMode]);

  const [formData, setFormData] = useState({
    displayName: isPreviewMode ? 'Simulation Admin' : (profile?.displayName || ''),
    studentId: isPreviewMode ? '1650700000' : (profile?.studentId || ''),
    degreeLevel: isPreviewMode ? previewDegreeLevel : (profile?.degreeLevel || DegreeLevel.MASTER),
    major: isPreviewMode ? 'System Simulation' : (profile?.major || ''),
    photoURL: isPreviewMode ? '' : (profile?.photoURL || ''),
  });

  useEffect(() => {
    if (profile && !isPreviewMode) {
      setFormData({
        displayName: profile.displayName || '',
        studentId: profile.studentId || '',
        degreeLevel: profile.degreeLevel || DegreeLevel.MASTER,
        major: profile.major || '',
        photoURL: profile.photoURL || '',
      });
    }
  }, [profile, isPreviewMode]);

  useEffect(() => {
    if (isPreviewMode) {
      setFormData(prev => ({ ...prev, degreeLevel: previewDegreeLevel }));
    }
  }, [previewDegreeLevel, isPreviewMode]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isPreviewMode) return;

    try {
      setLoading(true);
      const dataUrl = await compressImage(file);
      setFormData(prev => ({ ...prev, photoURL: dataUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    if (isPreviewMode) return;
    setFormData(prev => ({ ...prev, photoURL: '' }));
  };

  const [isHovering, setIsHovering] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/') && !isPreviewMode) {
      try {
        setLoading(true);
        const dataUrl = await compressImage(file);
        setFormData(prev => ({ ...prev, photoURL: dataUrl }));
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      if (isPreviewMode) {
        // Just navigate to dashboard which will handle redirect if needed
        navigate('/admin/dashboard');
        return;
      }
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || isPreviewMode) return;

    setLoading(true);
    setSuccess(false);

    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`, auth);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Retrieving Profile Data</p>
      </div>
    );
  }

  if (!profile && !isPreviewMode) return null;

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <UserCircle className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isPreviewMode ? 'Simulation View' : 'Student Identity'}</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">{isPreviewMode ? 'Student Preview' : 'Your Profile'}</h1>
        <p className="text-slate-500 font-bold tracking-tight">
          {isPreviewMode ? 'Currently simulating student experience. Data below is for demonstration only.' : 'Manage your academic credentials and system preferences.'}
        </p>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-morphism p-10 rounded-[40px] relative overflow-hidden border-none shadow-2xl">
            {/* Profile Picture Header */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-slate-100 relative z-10">
              <div 
                className="relative group"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={cn(
                  "w-32 h-32 rounded-[40px] bg-slate-50 border overflow-hidden shadow-inner flex items-center justify-center transition-all duration-300",
                  isHovering ? "border-brand-lime ring-4 ring-brand-lime/20 scale-105" : "border-slate-200"
                )}>
                  {formData.photoURL ? (
                    <img 
                      src={formData.photoURL} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className={cn("w-16 h-16 transition-colors", isHovering ? "text-brand-lime" : "text-slate-200")} />
                  )}
                </div>
                {!isPreviewMode && (
                  <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 border-4 border-white text-white rounded-2xl flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-all shadow-lg active:scale-90">
                    <Camera className="w-5 h-5" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                )}
                {formData.photoURL && !isPreviewMode && (
                  <button 
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 border-4 border-white text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-red-600 transition-all shadow-sm active:scale-90"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase tracking-widest leading-tight">
                  {formData.displayName || 'ชื่อ: (ไม่ได้ระบุ)'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">
                  {formData.studentId || 'รหัสนักศึกษา: (ไม่ได้ระบุ)'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-slate-100 text-[10px] font-black text-slate-600 rounded-lg uppercase tracking-widest border border-slate-200">
                    {formData.major || '(ยังไม่ได้ระบุสาขาวิชา)'}
                  </span>
                  <span className="px-3 py-1 bg-brand-lime/10 text-[10px] font-black text-brand-lime border border-brand-lime/20 rounded-lg uppercase tracking-widest">
                    {formData.degreeLevel || 'โปรดอัปเดตระดับการศึกษา'}
                  </span>
                </div>
                {!isPreviewMode && (
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-6 flex items-center gap-2 justify-center md:justify-start">
                    <Upload className="w-3 h-3" />
                    JPEG or PNG • Max 1MB
                  </p>
                )}
              </div>
            </div>

            <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
              <User className="w-64 h-64" />
            </div>

            <div className="relative z-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-5 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all text-lg tracking-tight"
                      value={formData.displayName}
                      onChange={e => setFormData({...formData, displayName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student ID</label>
                  <div className="relative group">
                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. 1650700000"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-5 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all font-mono text-lg"
                      value={formData.studentId}
                      onChange={e => setFormData({...formData, studentId: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Degree Level</label>
                  <div className="relative group">
                    <GraduationCap className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <select
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-10 py-5 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all appearance-none cursor-pointer text-lg tracking-tight"
                      value={formData.degreeLevel}
                      onChange={e => setFormData({...formData, degreeLevel: e.target.value as DegreeLevel})}
                    >
                      <option className="bg-white" value={DegreeLevel.MASTER}>{DegreeLevel.MASTER}</option>
                      <option className="bg-white" value={DegreeLevel.DOCTORAL}>{DegreeLevel.DOCTORAL}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Major / Program</label>
                  <div className="relative group">
                    <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. Information Technology"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-5 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-brand-lime/20 focus:border-brand-lime transition-all text-lg tracking-tight"
                      value={formData.major}
                      onChange={e => setFormData({...formData, major: e.target.value})}
                    />
                  </div>
                </div>
              </div>

                <div className="pt-6 flex items-center gap-6">
                  <button
                    type="submit"
                    disabled={loading || isPreviewMode}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-slate-950/20 flex items-center justify-center gap-3 group active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[11px]"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    {isPreviewMode ? 'Simulation Mode Only' : 'Sync Profile Credentials'}
                  </button>
                <AnimatePresence>
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-3 text-emerald-600 font-black text-[11px] bg-emerald-50 px-6 py-5 rounded-2xl border border-emerald-100 uppercase tracking-widest"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Updated
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Account Settings Card */}
          <div className="glass-morphism p-10 rounded-[40px] flex flex-col sm:flex-row items-center justify-between gap-8 border-none shadow-xl">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shadow-sm">
                <Shield className="w-8 h-8" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-black text-slate-900 text-lg tracking-tight leading-none mb-1">Session Management</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">End your current session across this device.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto px-10 py-5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl border border-slate-100 hover:border-red-200 transition-all font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 group active:scale-95 shadow-sm"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {isPreviewMode ? 'Exit Simulation' : 'Disconnect'}
            </button>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-8">
          <div className="glass-morphism p-10 rounded-[40px] border-none shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue blur-[60px] -mr-16 -mt-16 opacity-10" />
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">System Credentials</h4>
            <div className="space-y-10">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Email Authority</p>
                  <p className="text-sm font-black text-slate-900 truncate tracking-tight">
                    {isPreviewMode ? 'simulation@bu.ac.th' : (profile?.email || 'N/A')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Enrollment Date</p>
                  <p className="text-sm font-black text-slate-900 tracking-tight">
                    {profile?.createdAt?.toDate ? profile.createdAt.toDate().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'May 2026'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 bg-slate-900 rounded-[40px] text-white overflow-hidden relative group shadow-2xl">
            <div className="absolute top-0 right-0 p-10 opacity-20 transform scale-150 rotate-12 group-hover:rotate-[25deg] transition-transform duration-1000">
              <GraduationCap className="w-32 h-32" />
            </div>
            <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-4">Official Channel</h4>
            <h4 className="text-2xl font-black relative z-10 leading-none tracking-tighter uppercase tracking-widest">Academic Helpdesk</h4>
            <p className="text-slate-400 text-xs mt-4 relative z-10 leading-relaxed font-bold">
              Encountering data discrepancies? Connect with the Graduate Office for official verification.
            </p>
            <a href="mailto:gs@bu.ac.th" className="inline-flex mt-8 px-10 py-5 bg-brand-lime text-slate-900 rounded-2xl text-[11px] font-black relative z-10 hover:shadow-xl hover:shadow-brand-lime/20 transition-all active:scale-95 uppercase tracking-widest border border-brand-lime">
              Contact Registrar
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
