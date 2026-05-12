import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole, DegreeLevel } from '../lib/utils';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isPreviewMode: boolean;
  previewDegreeLevel: DegreeLevel;
  setPreviewMode: (enabled: boolean) => void;
  setPreviewLevel: (level: DegreeLevel) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(() => localStorage.getItem('isAdminPreview') === 'true');
  const [previewDegreeLevel, setPreviewDegreeLevel] = useState<DegreeLevel>(DegreeLevel.MASTER);

  useEffect(() => {
    let unsubProfile: Unsubscribe | null = null;

    const checkAuth = async () => {
      // Check for mock admin session
      const isAdminFlag = localStorage.getItem('isAdmin') === 'true';
      const bypassEmail = localStorage.getItem('adminEmail');

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }

        if (firebaseUser || bypassEmail === 'admin.bu.ac.th') {
          // Synthesis for bypass
          if (!firebaseUser && bypassEmail === 'admin.bu.ac.th') {
            setUser({ uid: 'admin_test', email: 'admin.bu.ac.th' } as User);
            setProfile({
              uid: 'admin_test',
              email: 'admin.bu.ac.th',
              displayName: 'Emergency Administrator',
              role: UserRole.ADMIN,
              createdAt: new Date(),
              updatedAt: new Date()
            } as any);
            setLoading(false);
            return;
          }

          setUser(firebaseUser);
          const userDocRef = doc(db, 'users', firebaseUser!.uid);
          
          unsubProfile = onSnapshot(userDocRef, async (snap) => {
            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              setProfile(data);
              console.log(`[DEBUG] Current Role: ${data.role} (Firebase - ${firebaseUser?.isAnonymous ? 'Anon' : 'Auth'})`);
            } else if (isAdminFlag || firebaseUser?.email === 'admin@bu.ac.th' || bypassEmail === 'admin.bu.ac.th') {
              // Provisioning or Bypassing
              const adminProfile = {
                uid: firebaseUser!.uid,
                email: 'admin.bu.ac.th',
                displayName: 'System Admin',
                role: UserRole.ADMIN,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };
              setProfile(adminProfile as any); // Optimistic bypass
              try {
                await setDoc(userDocRef, adminProfile, { merge: true });
              } catch (e) {
                console.error('[DEBUG] Admin Provisioning failed:', e);
              }
            } else {
              setProfile(null);
            }
            setLoading(false);
          }, (error) => {
            if (isAdminFlag || bypassEmail === 'admin.bu.ac.th') {
              console.log('[DEBUG] Admin permissions missing, using bypass profile...');
              setProfile({
                uid: firebaseUser!.uid,
                email: 'admin.bu.ac.th',
                role: UserRole.ADMIN,
                displayName: 'System Admin'
              } as any);
            }
            setLoading(false);
          });
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      });

      return unsubscribe;
    };

    const unsubAuthPromise = checkAuth();

    return () => {
      unsubAuthPromise.then(unsub => unsub && unsub());
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const signOut = async () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('isAdminPreview');
    await auth.signOut();
    setProfile(null);
    setUser(null);
    setIsPreviewMode(false);
  };

  const setPreviewMode = (enabled: boolean) => {
    setIsPreviewMode(enabled);
    if (enabled) {
      localStorage.setItem('isAdminPreview', 'true');
    } else {
      localStorage.removeItem('isAdminPreview');
    }
  };

  const setPreviewLevel = (level: DegreeLevel) => {
    setPreviewDegreeLevel(level);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signOut, 
      isPreviewMode, 
      previewDegreeLevel, 
      setPreviewMode, 
      setPreviewLevel 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
