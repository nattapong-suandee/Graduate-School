import React from 'react';
import { Home, Calendar, GraduationCap, FileText, User, Settings, Database, ArrowLeft, Layers, ClipboardList } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn, UserRole, DegreeLevel } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { onSnapshot, doc } from 'firebase/firestore';

const studentNavItems = [
  { label: 'Home', icon: Home, href: '/dashboard' },
  { label: 'Profile', icon: User, href: '/profile' },
  { label: 'Schedule', icon: Calendar, href: '/schedule' },
  { label: 'Comprehensive Exam', icon: ClipboardList, href: '/comprehensive-exam' },
  { label: 'Thesis', icon: FileText, href: '/thesis' },
  { label: 'Graduation', icon: GraduationCap, href: '/graduation' },
];

const adminNavItems = [
  { label: 'Overview', icon: Home, href: '/admin/dashboard' },
  { label: 'Manage Content', icon: Database, href: '/admin/manage' },
  { label: 'App Settings', icon: Settings, href: '/admin/settings' },
];

export function BottomNav() {
  const location = useLocation();
  const { profile, isPreviewMode } = useAuth();
  
  const items = (profile?.role === UserRole.ADMIN && !isPreviewMode) ? adminNavItems : studentNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t-0 px-4 py-2 flex justify-around items-center z-50 sm:hidden m-4 rounded-3xl">
      {items.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center gap-1 p-3 transition-all rounded-2xl",
              isActive ? "bg-brand-lime text-slate-900 shadow-lg shadow-brand-lime/20" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { profile, isPreviewMode } = useAuth();

  const items = (profile?.role === UserRole.ADMIN && !isPreviewMode) ? adminNavItems : studentNavItems;

  return (
    <aside className="hidden sm:flex flex-col w-64 glass border-y-0 border-l-0 h-[calc(100vh-2rem)] sticky top-4 m-4 rounded-3xl p-6">
      <div className="mb-10 px-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <span className="text-sm font-bold text-white">BU</span>
        </div>
        <h1 className="text-lg font-bold text-white leading-tight">
          Graduate Portal
        </h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "glass-nav-item",
                isActive && "glass-nav-item-active"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {profile?.role === UserRole.ADMIN && !isPreviewMode && (
        <div className="mt-auto p-4 glass rounded-2xl border-blue-500/10">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-2">Authenticated As</p>
          <p className="text-sm font-bold text-white truncate">{profile.displayName}</p>
          <p className="text-[10px] text-slate-500">System Administrator</p>
        </div>
      )}
    </aside>
  );
}

export function AdminPreviewBanner() {
  const { isPreviewMode, setPreviewMode, previewDegreeLevel, setPreviewLevel } = useAuth();

  if (!isPreviewMode) return null;

  return (
    <motion.div 
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      className="bg-orange-600 text-white px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-4 z-[100] sticky top-0 shadow-lg"
    >
      <div className="flex items-center gap-3 font-bold text-xs">
        <div className="bg-white/20 p-1.5 rounded-lg">
          <Layers className="w-4 h-4" />
        </div>
        <span className="uppercase tracking-widest">Preview Mode: Viewing as Student</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex bg-orange-700/50 p-1 rounded-xl">
          <button
            onClick={() => setPreviewLevel(DegreeLevel.MASTER)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
              previewDegreeLevel === DegreeLevel.MASTER ? "bg-white text-orange-600 shadow-sm" : "hover:bg-white/10"
            )}
          >
            Master's
          </button>
          <button
            onClick={() => setPreviewLevel(DegreeLevel.DOCTORAL)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
              previewDegreeLevel === DegreeLevel.DOCTORAL ? "bg-white text-orange-600 shadow-sm" : "hover:bg-white/10"
            )}
          >
            Doctoral
          </button>
        </div>

        <button
          onClick={() => {
            setPreviewMode(false);
            window.location.href = '/admin/dashboard';
          }}
          className="flex items-center gap-2 px-4 py-1.5 bg-white text-orange-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all active:scale-95"
        >
          <ArrowLeft className="w-3 h-3" />
          Exit Preview
        </button>
      </div>
    </motion.div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isPreviewMode } = useAuth();
  const [bgImage, setBgImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'global_settings', 'theme'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.backgroundImage) {
          setBgImage(data.backgroundImage);
        }
      }
    });
    return () => unsub();
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col relative transition-all duration-1000">
      {/* Dynamic Background Image */}
      {bgImage && (
        <div 
          className="fixed inset-0 -z-20 bg-cover bg-center bg-fixed transition-all duration-1000 animate-in fade-in"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}
      {/* Background Overlay */}
      <div className={cn(
        "fixed inset-0 -z-10 transition-colors duration-1000",
        bgImage ? "bg-[#f8fbff]/80" : "mesh-bg"
      )} />

      <AdminPreviewBanner />
      <div className="flex flex-col sm:flex-row flex-1">
        <Sidebar />
        <main className="flex-1 pb-24 sm:pb-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 sm:p-10">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
