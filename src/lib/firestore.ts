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

// Environment check for conditional logging
const isDev = import.meta.env.DEV;

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
  photoURL?: string;
  createdAt: string;
  // Optional fields
  qualifications?: string;
  degreeLevel?: string;
  majorSubjects?: string[];
  teachingStyle?: string;
}

export interface StudentProfile {
  uid: string;
  fullName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  // Optional fields
  currentlyStudying?: string;
  gradeLevel?: string;
  interests?: string[];
  learningGoals?: string;
  preferredSubjects?: string[];
}

// Blog Types and Functions
export interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  authorId: string;
  authorName: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
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
  studentEmail?: string;
  tutorId: string;
  tutorName: string;
  tutorEmail?: string;
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

// Quiz & Flashcard Types
export interface Flashcard {
  id?: string;
  conceptTitle: string;
  explanation: string;
  formula?: string;
  realLifeExample: string;
  hint: string;
  imageUrl?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'conceptual' | 'numerical';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  flashcardIndex: number; // Maps to which flashcard this question relates to
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Quiz {
  id?: string;
  tutorId: string;
  tutorName: string;
  subject: string;
  topic: string;
  targetLevel: 'school' | 'college';
  flashcards: Flashcard[];
  questions: QuizQuestion[];
  isPublished: boolean;
  createdAt: string;
  publishedAt?: string;
}

export interface QuizAssignment {
  id?: string;
  quizId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  tutorId: string;
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface QuizResult {
  id?: string;
  quizId: string;
  studentId: string;
  studentName: string;
  assignmentId: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skipped: number;
  accuracy: number;
  answers: { questionId: string; selectedAnswer: string | null; isCorrect: boolean }[];
  completedAt: string;
  timeTaken: number; // in seconds
}

// Tutor functions
export const getTutors = async (): Promise<TutorProfile[]> => {
  try {
    // Fetch all tutors and filter client-side to avoid index issues
    const snapshot = await getDocs(collection(db, 'tutorProfiles'));
    const allTutors = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as TutorProfile));
    const approvedTutors = allTutors.filter(tutor => tutor.isApproved === true);
    return approvedTutors;
  } catch (error) {
    if (isDev) console.error('Error fetching tutors:', error);
    return [];
  }
};

export const getAllTutors = async (): Promise<TutorProfile[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'tutorProfiles'));
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as TutorProfile));
  } catch (error) {
    if (isDev) console.error('Error fetching all tutors:', error);
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
    if (isDev) console.error('Error fetching tutor profile:', error);
    return null;
  }
};

export const createTutorProfile = async (profile: TutorProfile): Promise<void> => {
  try {
    // Use setDoc with merge option to create or update the document
    await setDoc(doc(db, 'tutorProfiles', profile.uid), profile, { merge: true });
  } catch (error) {
    if (isDev) console.error('Error creating tutor profile:', error);
    throw error;
  }
};

export const updateTutorProfile = async (uid: string, data: Partial<TutorProfile>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'tutorProfiles', uid), data);
  } catch (error) {
    if (isDev) console.error('Error updating tutor profile:', error);
    throw error;
  }
};

export const approveTutor = async (uid: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'tutorProfiles', uid), { isApproved: true });
  } catch (error) {
    if (isDev) console.error('Error approving tutor:', error);
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
    if (isDev) console.error('Error fetching availability:', error);
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
    if (isDev) console.error('Error setting availability:', error);
    throw error;
  }
};

export const deleteAvailabilitySlot = async (slotId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'availability', slotId));
  } catch (error) {
    if (isDev) console.error('Error deleting availability slot:', error);
    throw error;
  }
};

// Session functions
export const createSession = async (session: Omit<Session, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'sessions'), {
      ...session,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    if (isDev) console.error('Error creating session:', error);
    throw error;
  }
};

export const getStudentSessions = async (studentId: string): Promise<Session[]> => {
  try {
    // Use query with where clause to respect Firestore security rules
    const q = query(collection(db, 'sessions'), where('studentId', '==', studentId));
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Session));
    return sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    if (isDev) console.error('Error fetching student sessions:', error);
    return [];
  }
};

export const getTutorSessions = async (tutorId: string): Promise<Session[]> => {
  try {
    // Use query with where clause to respect Firestore security rules
    const q = query(collection(db, 'sessions'), where('tutorId', '==', tutorId));
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Session));
    return sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    if (isDev) console.error('Error fetching tutor sessions:', error);
    return [];
  }
};

export const getAllSessions = async (): Promise<Session[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'sessions'));
    const sessions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Session));
    return sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    if (isDev) console.error('Error fetching all sessions:', error);
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
    if (isDev) console.error('Error updating session:', error);
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
    if (isDev) console.error('Error fetching goals:', error);
    return [];
  }
};

export const createLearningGoal = async (goal: Omit<LearningGoal, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'learningGoals'), goal);
    return docRef.id;
  } catch (error) {
    if (isDev) console.error('Error creating goal:', error);
    throw error;
  }
};

export const updateLearningGoal = async (goalId: string, data: Partial<LearningGoal>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'learningGoals', goalId), data);
  } catch (error) {
    if (isDev) console.error('Error updating goal:', error);
    throw error;
  }
};

export const deleteLearningGoal = async (goalId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'learningGoals', goalId));
  } catch (error) {
    if (isDev) console.error('Error deleting goal:', error);
    throw error;
  }
};

// User management functions (Admin)
export const getAllUsers = async (): Promise<any[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
  } catch (error) {
    if (isDev) console.error('Error fetching users:', error);
    return [];
  }
};

export const updateUserStatus = async (uid: string, isActive: boolean): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), { isActive });
  } catch (error) {
    if (isDev) console.error('Error updating user status:', error);
    throw error;
  }
};

// Delete user and all related data (Admin only)
export const deleteUser = async (uid: string, role: string): Promise<void> => {
  try {
    // Delete from users collection
    await deleteDoc(doc(db, 'users', uid));
    
    // Delete role-specific profile
    if (role === 'tutor') {
      await deleteDoc(doc(db, 'tutorProfiles', uid));
      // Delete tutor's availability slots
      const availabilitySnapshot = await getDocs(query(collection(db, 'availability'), where('tutorId', '==', uid)));
      await Promise.all(availabilitySnapshot.docs.map(d => deleteDoc(doc(db, 'availability', d.id))));
    } else if (role === 'student') {
      await deleteDoc(doc(db, 'studentProfiles', uid));
      // Delete student's learning goals
      const goalsSnapshot = await getDocs(query(collection(db, 'learningGoals'), where('studentId', '==', uid)));
      await Promise.all(goalsSnapshot.docs.map(d => deleteDoc(doc(db, 'learningGoals', d.id))));
    }
  } catch (error) {
    if (isDev) console.error('Error deleting user:', error);
    throw error;
  }
};

// Admin Notification Types and Functions
export interface AdminNotification {
  id?: string;
  type: 'new_student' | 'new_tutor' | 'session_booked' | 'session_completed' | 'tutor_approved' | 'new_review';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    sessionId?: string;
    tutorId?: string;
  };
}

export const createAdminNotification = async (notification: Omit<AdminNotification, 'id' | 'isRead' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'adminNotifications'), {
      ...notification,
      isRead: false,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    if (isDev) console.error('Error creating notification:', error);
    throw error;
  }
};

export const getAdminNotifications = async (limit?: number): Promise<AdminNotification[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'adminNotifications'));
    let notifications = snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as AdminNotification))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (limit) {
      notifications = notifications.slice(0, limit);
    }
    return notifications;
  } catch (error) {
    if (isDev) console.error('Error fetching notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'adminNotifications', notificationId), { isRead: true });
  } catch (error) {
    if (isDev) console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const snapshot = await getDocs(collection(db, 'adminNotifications'));
    const unreadDocs = snapshot.docs.filter(doc => !doc.data().isRead);
    await Promise.all(unreadDocs.map(d => updateDoc(doc(db, 'adminNotifications', d.id), { isRead: true })));
  } catch (error) {
    if (isDev) console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'adminNotifications', notificationId));
  } catch (error) {
    if (isDev) console.error('Error deleting notification:', error);
    throw error;
  }
};

// Review Types and Functions
export interface Review {
  id?: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  tutorId: string;
  tutorName: string;
  rating: number; // 1-5
  comment: string;
  subject: string;
  createdAt: string;
}

export const createReview = async (review: Omit<Review, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'reviews'), {
      ...review,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    if (isDev) console.error('Error creating review:', error);
    throw error;
  }
};

export const getTutorReviews = async (tutorId: string): Promise<Review[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'reviews'));
    const allReviews = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Review));
    return allReviews
      .filter(r => r.tutorId === tutorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    if (isDev) console.error('Error fetching tutor reviews:', error);
    return [];
  }
};

export const getAllReviews = async (): Promise<Review[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'reviews'));
    return snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as Review))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    if (isDev) console.error('Error fetching all reviews:', error);
    return [];
  }
};

export const getSessionReview = async (sessionId: string): Promise<Review | null> => {
  try {
    const snapshot = await getDocs(collection(db, 'reviews'));
    const reviews = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Review));
    return reviews.find(r => r.sessionId === sessionId) || null;
  } catch (error) {
    if (isDev) console.error('Error fetching session review:', error);
    return null;
  }
};

// Blog functions
export const createBlogPost = async (post: Omit<BlogPost, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'blogPosts'), {
      ...post,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    if (isDev) console.error('Error creating blog post:', error);
    throw error;
  }
};

export const updateBlogPost = async (postId: string, data: Partial<BlogPost>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'blogPosts', postId), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    if (isDev) console.error('Error updating blog post:', error);
    throw error;
  }
};

export const deleteBlogPost = async (postId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'blogPosts', postId));
  } catch (error) {
    if (isDev) console.error('Error deleting blog post:', error);
    throw error;
  }
};

export const getAllBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'blogPosts'));
    return snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as BlogPost))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    if (isDev) console.error('Error fetching all blog posts:', error);
    return [];
  }
};

export const getPublishedBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    // Use a query to only fetch published posts - required by Firestore security rules
    const q = query(collection(db, 'blogPosts'), where('isPublished', '==', true));
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BlogPost));
    return posts.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
  } catch (error) {
    if (isDev) console.error('Error fetching published blog posts:', error);
    return [];
  }
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  try {
    const normalizedSlug = decodeURIComponent(slug);
    const q = query(
      collection(db, 'blogPosts'),
      where('slug', '==', normalizedSlug),
      where('isPublished', '==', true)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { ...(docSnap.data() as BlogPost), id: docSnap.id };
  } catch (error) {
    if (isDev) console.error('Error fetching blog post by slug:', error);
    return null;
  }
};

export const getBlogPostById = async (postId: string): Promise<BlogPost | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'blogPosts', postId));
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as BlogPost;
    }
    return null;
  } catch (error) {
    if (isDev) console.error('Error fetching blog post:', error);
    return null;
  }
};

// Quiz functions
export const createQuiz = async (quiz: Omit<Quiz, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'quizzes'), {
      ...quiz,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    if (isDev) console.error('Error creating quiz:', error);
    throw error;
  }
};

export const getTutorQuizzes = async (tutorId: string): Promise<Quiz[]> => {
  try {
    const q = query(collection(db, 'quizzes'), where('tutorId', '==', tutorId));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as Quiz))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    if (isDev) console.error('Error fetching tutor quizzes:', error);
    return [];
  }
};

export const getQuizById = async (quizId: string): Promise<Quiz | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'quizzes', quizId));
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as Quiz;
    }
    return null;
  } catch (error) {
    if (isDev) console.error('Error fetching quiz:', error);
    return null;
  }
};

export const updateQuiz = async (quizId: string, data: Partial<Quiz>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'quizzes', quizId), data);
  } catch (error) {
    if (isDev) console.error('Error updating quiz:', error);
    throw error;
  }
};

export const publishQuiz = async (quizId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'quizzes', quizId), { 
      isPublished: true, 
      publishedAt: new Date().toISOString() 
    });
  } catch (error) {
    if (isDev) console.error('Error publishing quiz:', error);
    throw error;
  }
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'quizzes', quizId));
    // Also delete all assignments for this quiz
    const assignmentsSnapshot = await getDocs(query(collection(db, 'quizAssignments'), where('quizId', '==', quizId)));
    await Promise.all(assignmentsSnapshot.docs.map(d => deleteDoc(doc(db, 'quizAssignments', d.id))));
  } catch (error) {
    if (isDev) console.error('Error deleting quiz:', error);
    throw error;
  }
};

// Quiz Assignment functions
export const createQuizAssignment = async (assignment: Omit<QuizAssignment, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'quizAssignments'), assignment);
    return docRef.id;
  } catch (error) {
    if (isDev) console.error('Error creating quiz assignment:', error);
    throw error;
  }
};

export const getStudentAssignments = async (studentId: string): Promise<QuizAssignment[]> => {
  try {
    const q = query(collection(db, 'quizAssignments'), where('studentId', '==', studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as QuizAssignment))
      .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  } catch (error) {
    if (isDev) console.error('Error fetching student assignments:', error);
    return [];
  }
};

export const getQuizAssignments = async (quizId: string, tutorId: string): Promise<QuizAssignment[]> => {
  try {
    // Query must include tutorId to satisfy Firestore security rules
    const q = query(
      collection(db, 'quizAssignments'), 
      where('quizId', '==', quizId),
      where('tutorId', '==', tutorId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as QuizAssignment));
  } catch (error) {
    if (isDev) console.error('Error fetching quiz assignments:', error);
    return [];
  }
};

export const updateQuizAssignment = async (assignmentId: string, data: Partial<QuizAssignment>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'quizAssignments', assignmentId), data);
  } catch (error) {
    if (isDev) console.error('Error updating quiz assignment:', error);
    throw error;
  }
};

// Quiz Result functions
export const saveQuizResult = async (result: Omit<QuizResult, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'quizResults'), result);
    return docRef.id;
  } catch (error) {
    if (isDev) console.error('Error saving quiz result:', error);
    throw error;
  }
};

export const getStudentResults = async (studentId: string): Promise<QuizResult[]> => {
  try {
    const q = query(collection(db, 'quizResults'), where('studentId', '==', studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as QuizResult))
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  } catch (error) {
    if (isDev) console.error('Error fetching student results:', error);
    return [];
  }
};

export const getQuizResults = async (quizId: string): Promise<QuizResult[]> => {
  try {
    const q = query(collection(db, 'quizResults'), where('quizId', '==', quizId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as QuizResult));
  } catch (error) {
    if (isDev) console.error('Error fetching quiz results:', error);
    return [];
  }
};

// Get all students for quiz assignment
export const getAllStudents = async (): Promise<StudentProfile[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'studentProfiles'));
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as StudentProfile));
  } catch (error) {
    if (isDev) console.error('Error fetching all students:', error);
    return [];
  }
};

export const getStudentProfile = async (uid: string): Promise<StudentProfile | null> => {
  try {
    const docRef = doc(db, 'studentProfiles', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), uid: docSnap.id } as StudentProfile;
    }
    return null;
  } catch (error) {
    if (isDev) console.error('Error fetching student profile:', error);
    return null;
  }
};