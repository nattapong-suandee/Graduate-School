import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, auth: any) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const BU_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+\.[a-zA-Z0-9]{4}@bumail\.net$/;

export function validateBUEmail(email: string): boolean {
  return BU_EMAIL_REGEX.test(email);
}

export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
}

export enum DegreeLevel {
  MASTER = "Master's Degree",
  DOCTORAL = "Doctoral Degree",
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  degreeLevel?: DegreeLevel;
  displayName: string;
  studentId?: string;
  major?: string;
  photoURL?: string;
  thesisTitle?: string;
  thesisProgress?: number; // 1-7
  graduationStep?: number; // 1-5
  createdAt?: any;
}

export interface AcademicContent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'Class' | 'Exam';
  target: DegreeLevel;
  createdAt: any;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'General' | 'Thesis' | 'Event';
  createdAt: any;
}

export interface ClassSchedule {
  id: string;
  subjectName: string;
  subjectCode: string;
  date: string;
  timeRange: string;
  room: string;
  target: DegreeLevel;
  createdAt: any;
}

export interface ComprehensiveExam {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  target: DegreeLevel;
  createdAt: any;
}

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to 0.6 quality to ensure it fits in Firestore doc (1MB limit but Base64 is larger)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
