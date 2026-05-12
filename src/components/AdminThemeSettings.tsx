import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, Loader2, Save, X, Globe } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn, compressImage } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../contexts/AuthContext';

export default function AdminThemeSettings() {
  const [imageUrl, setImageUrl] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    async function fetchTheme() {
      try {
        const docRef = doc(db, 'global_settings', 'theme');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.backgroundImage) {
            setPreview(data.backgroundImage);
          }
        }
      } catch (error) {
        console.error("Error fetching theme:", error);
      } finally {
        setFetching(false);
      }
    }
    fetchTheme();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file.' });
      return;
    }

    try {
      setLoading(true);
      const compressed = await compressImage(file);
      setPreview(compressed);
      setImageUrl(''); // Clear URL if file is selected
      setMessage(null);
    } catch (error) {
      console.error("Compression error:", error);
      setMessage({ type: 'error', text: 'Failed to process image.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    const finalImage = imageUrl || preview;
    if (!finalImage) {
      setMessage({ type: 'error', text: 'Please provide an image or URL.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await setDoc(doc(db, 'global_settings', 'theme'), {
        backgroundImage: finalImage,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setMessage({ type: 'success', text: 'App background updated successfully!' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'global_settings/theme');
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="glass p-8 rounded-3xl flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="glass p-8 rounded-[40px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
          <Globe className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">App Customization</h3>
          <p className="text-slate-500 font-medium tracking-tight">Set the global background theme for all users.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview Section */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-2">Background Preview</label>
          <div className="aspect-video glass rounded-3xl overflow-hidden relative group border-2 border-dashed border-white/5 bg-white/[0.02]">
            {preview ? (
              <>
                <img src={preview} alt="Background Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setPreview(null); setImageUrl(''); }}
                    className="p-3 bg-red-500 text-white rounded-2xl hover:bg-red-400 transition-all active:scale-95"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-3">
                <ImageIcon className="w-12 h-12" />
                <p className="text-xs font-bold uppercase tracking-widest">No preview available</p>
              </div>
            )}
          </div>
        </div>

        {/* Inputs Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-2">Upload Image</label>
            <div className="relative">
              <input
                type="file"
                id="bg-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label 
                htmlFor="bg-upload"
                className="flex items-center justify-center gap-3 px-6 py-8 bg-white/5 hover:bg-white/10 text-white rounded-3xl border-2 border-dashed border-white/10 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Camera className="w-6 h-6 text-blue-400" />
                <span className="font-bold">Select Local Image</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">OR</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-2">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setPreview(e.target.value);
                }}
                placeholder="https://example.com/background.jpg"
                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl p-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600 font-medium"
              />
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={loading || (!imageUrl && !preview)}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 group active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            Update Background Theme
          </button>

          {message && (
            <div className={cn(
              "p-4 rounded-xl text-center text-xs font-bold uppercase tracking-widest animate-in fade-in zoom-in duration-300",
              message.type === 'success' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            )}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
