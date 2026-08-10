import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

const isDev = import.meta.env.DEV;

// ============= Types =============

export type GroupPackageType = 'batch' | 'cohort';
export type GroupPackageStatus = 'pending' | 'approved' | 'rejected' | 'paused' | 'archived';

export interface GroupScheduleSlot {
  day: string; // Monday…Sunday
  time: string; // HH:mm
}

export interface GroupPackage {
  id?: string;
  tutorId: string;
  tutorName: string;
  tutorEmail?: string;
  title: string;
  subject: string;
  level: string;
  description?: string;
  type: GroupPackageType;
  seatLimit: number;
  enrolledCount: number;
  priceUsd: number;
  billingPeriod: 'monthly';
  schedule: GroupScheduleSlot[];
  startDate?: string;
  endDate?: string;
  status: GroupPackageStatus;
  rejectionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type GroupSubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export interface GroupSubscription {
  id?: string;
  packageId: string;
  packageTitle: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  tutorId: string;
  tutorName?: string;
  status: GroupSubscriptionStatus;
  paidThrough?: string;
  activatedBy?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupSession {
  id?: string;
  packageId: string;
  packageTitle?: string;
  tutorId: string;
  topic: string;
  scheduledAt: string; // ISO
  durationMinutes: number;
  zoomJoinUrl?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export const GROUP_LEVELS = [
  'Primary',
  'Middle School',
  'High School',
  'O / A Levels',
  'University',
  'Test Prep',
];

export const WEEK_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// ============= Group Packages =============

export const createGroupPackage = async (
  pkg: Omit<GroupPackage, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'enrolledCount'> & {
    status?: GroupPackageStatus;
  }
): Promise<string> => {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, 'groupPackages'), {
    ...pkg,
    enrolledCount: 0,
    status: pkg.status || 'pending',
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
};

export const updateGroupPackage = async (
  packageId: string,
  data: Partial<GroupPackage>
): Promise<void> => {
  await updateDoc(doc(db, 'groupPackages', packageId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteGroupPackage = async (packageId: string): Promise<void> => {
  await deleteDoc(doc(db, 'groupPackages', packageId));
};

const sortByCreated = <T extends { createdAt: string }>(items: T[]) =>
  [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

/** Public listing — only approved packages (matches security rules). */
export const getApprovedGroupPackages = async (): Promise<GroupPackage[]> => {
  try {
    const q = query(collection(db, 'groupPackages'), where('status', '==', 'approved'));
    const snap = await getDocs(q);
    return sortByCreated(snap.docs.map(d => ({ ...d.data(), id: d.id } as GroupPackage)));
  } catch (e) {
    if (isDev) console.error('Error fetching group packages:', e);
    return [];
  }
};

export const getGroupPackage = async (packageId: string): Promise<GroupPackage | null> => {
  try {
    const snap = await getDoc(doc(db, 'groupPackages', packageId));
    return snap.exists() ? ({ ...snap.data(), id: snap.id } as GroupPackage) : null;
  } catch (e) {
    if (isDev) console.error('Error fetching group package:', e);
    return null;
  }
};

export const getGroupPackagesForTutor = async (tutorId: string): Promise<GroupPackage[]> => {
  try {
    const q = query(collection(db, 'groupPackages'), where('tutorId', '==', tutorId));
    const snap = await getDocs(q);
    return sortByCreated(snap.docs.map(d => ({ ...d.data(), id: d.id } as GroupPackage)));
  } catch (e) {
    if (isDev) console.error('Error fetching tutor group packages:', e);
    return [];
  }
};

/** Admin only — reads every package regardless of status. */
export const getAllGroupPackages = async (): Promise<GroupPackage[]> => {
  try {
    const snap = await getDocs(collection(db, 'groupPackages'));
    return sortByCreated(snap.docs.map(d => ({ ...d.data(), id: d.id } as GroupPackage)));
  } catch (e) {
    if (isDev) console.error('Error fetching all group packages:', e);
    return [];
  }
};

// ============= Group Subscriptions =============

export const requestGroupSubscription = async (
  sub: Omit<GroupSubscription, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> => {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, 'groupSubscriptions'), {
    ...sub,
    status: 'pending' as GroupSubscriptionStatus,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
};

export const updateGroupSubscription = async (
  subscriptionId: string,
  data: Partial<GroupSubscription>
): Promise<void> => {
  await updateDoc(doc(db, 'groupSubscriptions', subscriptionId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteGroupSubscription = async (subscriptionId: string): Promise<void> => {
  await deleteDoc(doc(db, 'groupSubscriptions', subscriptionId));
};

export const getSubscriptionsForStudent = async (studentId: string): Promise<GroupSubscription[]> => {
  try {
    const q = query(collection(db, 'groupSubscriptions'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    return sortByCreated(snap.docs.map(d => ({ ...d.data(), id: d.id } as GroupSubscription)));
  } catch (e) {
    if (isDev) console.error('Error fetching student subscriptions:', e);
    return [];
  }
};

export const getSubscriptionsForTutor = async (tutorId: string): Promise<GroupSubscription[]> => {
  try {
    const q = query(collection(db, 'groupSubscriptions'), where('tutorId', '==', tutorId));
    const snap = await getDocs(q);
    return sortByCreated(snap.docs.map(d => ({ ...d.data(), id: d.id } as GroupSubscription)));
  } catch (e) {
    if (isDev) console.error('Error fetching tutor subscriptions:', e);
    return [];
  }
};

export const getAllGroupSubscriptions = async (): Promise<GroupSubscription[]> => {
  try {
    const snap = await getDocs(collection(db, 'groupSubscriptions'));
    return sortByCreated(snap.docs.map(d => ({ ...d.data(), id: d.id } as GroupSubscription)));
  } catch (e) {
    if (isDev) console.error('Error fetching group subscriptions:', e);
    return [];
  }
};

// ============= Group Sessions =============

export const createGroupSession = async (
  session: Omit<GroupSession, 'id' | 'createdAt' | 'status'> & { status?: GroupSession['status'] }
): Promise<string> => {
  const ref = await addDoc(collection(db, 'groupSessions'), {
    ...session,
    status: session.status || 'scheduled',
    createdAt: new Date().toISOString(),
  });
  return ref.id;
};

export const updateGroupSession = async (
  sessionId: string,
  data: Partial<GroupSession>
): Promise<void> => {
  await updateDoc(doc(db, 'groupSessions', sessionId), data);
};

export const deleteGroupSession = async (sessionId: string): Promise<void> => {
  await deleteDoc(doc(db, 'groupSessions', sessionId));
};

export const getSessionsForPackage = async (packageId: string): Promise<GroupSession[]> => {
  try {
    const q = query(collection(db, 'groupSessions'), where('packageId', '==', packageId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ ...d.data(), id: d.id } as GroupSession))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  } catch (e) {
    if (isDev) console.error('Error fetching group sessions:', e);
    return [];
  }
};

export const getSessionsForTutor = async (tutorId: string): Promise<GroupSession[]> => {
  try {
    const q = query(collection(db, 'groupSessions'), where('tutorId', '==', tutorId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ ...d.data(), id: d.id } as GroupSession))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  } catch (e) {
    if (isDev) console.error('Error fetching tutor group sessions:', e);
    return [];
  }
};

// ============= Helpers =============

export const seatsLeft = (pkg: GroupPackage) =>
  Math.max(0, (pkg.seatLimit || 0) - (pkg.enrolledCount || 0));

export const formatSchedule = (schedule: GroupScheduleSlot[] = []) =>
  schedule.length ? schedule.map(s => `${s.day} ${s.time}`).join(' · ') : 'Schedule to be announced';
