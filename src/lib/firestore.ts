import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  addDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface TutorProfile {
  uid: string;
  fullName: string;
  email: string;
  subjects: string[];
  bio: string;
  hourlyRate: number;
  experience: string;
  isApproved: boolean;
  createdAt: string;
}

export interface AvailabilitySlot {
  id?: string;
  tutorId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string;
}

export interface Session {
  id?: string;
  studentId: string;
  studentName: string;
  tutorId: string;
  tutorName: string;
  subject: string;
  date: string;
  time: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  zoomLink?: string;
  message?: string;
  createdAt: string;
}

export interface LearningGoal {
  id?: string;
  studentId: string;
  title: string;
  subject: string;
  progress: number;
  createdAt: string;
}

// Tutor functions
export const getTutors = async (): Promise<TutorProfile[]> => {
  try {
    // Fetch all tutors and filter client-side to avoid index issues
    const snapshot = await getDocs(collection(db, 'tutorProfiles'));
    const allTutors = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as TutorProfile));
    const approvedTutors = allTutors.filter(tutor => tutor.isApproved === true);
    console.log('Approved tutors found:', approvedTutors.length, approvedTutors);
    return approvedTutors;
  } catch (error) {
    console.error('Error fetching tutors:', error);
    return [];
  }
};

export const getAllTutors = async (): Promise<TutorProfile[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'tutorProfiles'));
    console.log('Fetched tutors count:', snapshot.docs.length);
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as TutorProfile));
  } catch (error) {
    console.error('Error fetching all tutors:', error);
    return [];
  }
};

export const getTutorProfile = async (uid: string): Promise<TutorProfile | null> => {
  try {
    const docRef = doc(db, 'tutorProfiles', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), uid: docSnap.id } as TutorProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching tutor profile:', error);
    return null;
  }
};

export const createTutorProfile = async (profile: TutorProfile): Promise<void> => {
  try {
    // Use setDoc with merge option to create or update the document
    await setDoc(doc(db, 'tutorProfiles', profile.uid), profile, { merge: true });
  } catch (error) {
    console.error('Error creating tutor profile:', error);
    throw error;
  }
};

export const updateTutorProfile = async (uid: string, data: Partial<TutorProfile>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'tutorProfiles', uid), data);
  } catch (error) {
    console.error('Error updating tutor profile:', error);
    throw error;
  }
};

export const approveTutor = async (uid: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'tutorProfiles', uid), { isApproved: true });
  } catch (error) {
    console.error('Error approving tutor:', error);
    throw error;
  }
};

// Availability functions
export const getTutorAvailability = async (tutorId: string): Promise<AvailabilitySlot[]> => {
  try {
    const q = query(collection(db, 'availability'), where('tutorId', '==', tutorId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AvailabilitySlot));
  } catch (error) {
    console.error('Error fetching availability:', error);
    return [];
  }
};

export const setTutorAvailability = async (slots: AvailabilitySlot[]): Promise<void> => {
  try {
    for (const slot of slots) {
      const { id, ...slotData } = slot;
      if (id) {
        await updateDoc(doc(db, 'availability', id), slotData);
      } else {
        await addDoc(collection(db, 'availability'), slotData);
      }
    }
  } catch (error) {
    console.error('Error setting availability:', error);
    throw error;
  }
};

export const deleteAvailabilitySlot = async (slotId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'availability', slotId));
  } catch (error) {
    console.error('Error deleting availability slot:', error);
    throw error;
  }
};

// Session functions
export const createSession = async (session: Omit<Session, 'id'>): Promise<string> => {
  try {
    console.log('Creating session:', session);
    const docRef = await addDoc(collection(db, 'sessions'), {
      ...session,
      createdAt: new Date().toISOString()
    });
    console.log('Session created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const getStudentSessions = async (studentId: string): Promise<Session[]> => {
  try {
    // Fetch all sessions and filter client-side to avoid composite index requirement
    const snapshot = await getDocs(collection(db, 'sessions'));
    const allSessions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Session));
    const studentSessions = allSessions
      .filter(s => s.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    console.log('Student sessions found:', studentSessions.length);
    return studentSessions;
  } catch (error) {
    console.error('Error fetching student sessions:', error);
    return [];
  }
};

export const getTutorSessions = async (tutorId: string): Promise<Session[]> => {
  try {
    // Fetch all sessions and filter client-side to avoid composite index requirement
    const snapshot = await getDocs(collection(db, 'sessions'));
    const allSessions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Session));
    const tutorSessions = allSessions
      .filter(s => s.tutorId === tutorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    console.log('Tutor sessions found:', tutorSessions.length, tutorSessions);
    return tutorSessions;
  } catch (error) {
    console.error('Error fetching tutor sessions:', error);
    return [];
  }
};

export const getAllSessions = async (): Promise<Session[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'sessions'));
    const sessions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Session));
    console.log('All sessions found:', sessions.length, sessions);
    return sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching all sessions:', error);
    return [];
  }
};

export const updateSessionStatus = async (
  sessionId: string, 
  status: Session['status'], 
  zoomLink?: string
): Promise<void> => {
  try {
    const updateData: Partial<Session> = { status };
    if (zoomLink) updateData.zoomLink = zoomLink;
    await updateDoc(doc(db, 'sessions', sessionId), updateData);
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

// Learning Goals functions
export const getStudentGoals = async (studentId: string): Promise<LearningGoal[]> => {
  try {
    const q = query(collection(db, 'learningGoals'), where('studentId', '==', studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LearningGoal));
  } catch (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
};

export const createLearningGoal = async (goal: Omit<LearningGoal, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'learningGoals'), goal);
    return docRef.id;
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
};

export const updateLearningGoal = async (goalId: string, data: Partial<LearningGoal>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'learningGoals', goalId), data);
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
};

export const deleteLearningGoal = async (goalId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'learningGoals', goalId));
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};

// User management functions (Admin)
export const getAllUsers = async (): Promise<any[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const updateUserStatus = async (uid: string, isActive: boolean): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), { isActive });
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};
