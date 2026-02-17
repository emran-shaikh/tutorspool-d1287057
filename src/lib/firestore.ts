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

// Demo Request Types and Functions
export interface DemoRequest {
  id?: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';
  timestamp: any;
  notes?: string;
}

export const getDemoRequests = async (): Promise<DemoRequest[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'demoRequests'));
    return snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as DemoRequest))
      .sort((a, b) => {
        const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp);
        const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp);
        return bTime.getTime() - aTime.getTime();
      });
  } catch (error) {
    if (isDev) console.error('Error fetching demo requests:', error);
    return [];
  }
};

export const updateDemoRequest = async (id: string, data: Partial<DemoRequest>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'demoRequests', id), data);
  } catch (error) {
    if (isDev) console.error('Error updating demo request:', error);
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

// Seed Blog Posts
export const seedBlogPosts = async (authorId: string, authorName: string, origin: string): Promise<number> => {
  const now = new Date().toISOString();
  const posts: Omit<BlogPost, 'id'>[] = [
    {
      title: "10 Proven Study Techniques to Ace Your Exams in 2025",
      slug: "10-proven-study-techniques-ace-exams-2025",
      excerpt: "Discover science-backed study methods that top students use to score higher, retain more, and reduce exam anxiety. From spaced repetition to active recall, these techniques will transform your preparation.",
      content: `<h2>Why Smart Studying Beats Hard Studying</h2>
<p>Most students spend hours re-reading textbooks and highlighting notes, yet research shows these are among the <strong>least effective</strong> study methods. The difference between top performers and average students isn't time spent—it's <em>how</em> they study.</p>

<h2>1. Active Recall</h2>
<p>Instead of passively reading, close your book and try to recall the information from memory. Studies show active recall improves long-term retention by up to <strong>150%</strong> compared to re-reading.</p>
<p><strong>How to apply it:</strong> After reading a chapter, write down everything you remember without looking. Then check what you missed.</p>

<h2>2. Spaced Repetition</h2>
<p>Review material at increasing intervals—1 day, 3 days, 7 days, 14 days. This leverages the <strong>spacing effect</strong>, one of the most robust findings in cognitive psychology.</p>

<h2>3. The Feynman Technique</h2>
<p>Named after Nobel Prize-winning physicist Richard Feynman, this technique involves explaining a concept in simple terms as if teaching a child. If you can't explain it simply, you don't understand it well enough.</p>

<h2>4. Pomodoro Technique</h2>
<p>Study in focused 25-minute blocks with 5-minute breaks. After four blocks, take a longer 15-30 minute break. This prevents burnout and maintains peak concentration.</p>

<h2>5. Interleaving Practice</h2>
<p>Instead of studying one subject for hours (blocking), mix different topics in a single session. Research shows interleaving improves problem-solving skills by <strong>43%</strong>.</p>

<h2>6. Mind Mapping</h2>
<p>Create visual diagrams connecting related concepts. Mind maps engage both hemispheres of the brain and help you see the bigger picture of how topics relate.</p>

<h2>7. Practice Testing</h2>
<p>Take practice exams under timed conditions. This not only tests your knowledge but also reduces test anxiety by familiarizing you with the exam format.</p>

<h2>8. Elaborative Interrogation</h2>
<p>Ask "why" and "how" questions about the material. For example, instead of memorizing "water boils at 100°C," ask "Why does water boil at 100°C at sea level?"</p>

<h2>9. Teach Others</h2>
<p>Teaching forces you to organize your thoughts, identify gaps in understanding, and explain concepts clearly. Find a study partner or even explain concepts to yourself out loud.</p>

<h2>10. Sleep and Exercise</h2>
<p>Don't underestimate the power of good sleep and regular exercise. Sleep consolidates memories, and exercise increases blood flow to the brain, improving cognitive function by up to <strong>20%</strong>.</p>

<h2>Start Today</h2>
<p>Pick two or three techniques that resonate with you and commit to using them for the next two weeks. You'll be amazed at the difference in your retention and exam performance.</p>

<p>Need personalized guidance? Our expert tutors at <strong>TutorsPool</strong> can help you develop a customized study plan tailored to your learning style and goals.</p>`,
      coverImage: `${origin}/blog/study-techniques.jpg`,
      authorId,
      authorName,
      isPublished: true,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      tags: ["Study Tips", "Exam Preparation", "Learning Strategies", "Student Success"],
      metaTitle: "10 Proven Study Techniques to Ace Your Exams | TutorsPool",
      metaDescription: "Discover 10 science-backed study techniques including active recall, spaced repetition, and the Feynman technique to boost your exam scores and retention."
    },
    {
      title: "How Online Tutoring is Revolutionizing Education in 2025",
      slug: "online-tutoring-revolutionizing-education-2025",
      excerpt: "Online tutoring has grown 300% since 2020. Learn how AI-powered platforms, personalized learning paths, and expert tutors are making quality education accessible to everyone, everywhere.",
      content: `<h2>The Digital Education Revolution</h2>
<p>The way we learn has fundamentally changed. What started as a necessity during the pandemic has evolved into a <strong>preferred learning method</strong> for millions of students worldwide. Online tutoring isn't just a substitute for in-person learning—it's often <em>better</em>.</p>

<h2>The Numbers Tell the Story</h2>
<p>The online tutoring market is projected to reach <strong>$25.8 billion by 2027</strong>. But beyond the market size, what's truly remarkable are the outcomes:</p>
<ul>
<li>Students receiving online tutoring show <strong>30% faster improvement</strong> than traditional methods</li>
<li><strong>92% of students</strong> report feeling more comfortable asking questions online</li>
<li>One-on-one online sessions increase engagement by <strong>60%</strong> compared to classroom settings</li>
</ul>

<h2>Why Online Tutoring Works</h2>

<h3>1. Personalized Attention</h3>
<p>In a classroom of 30+ students, individual attention is scarce. Online tutoring provides dedicated 1-on-1 sessions where every minute is focused on the student's specific needs, pace, and learning style.</p>

<h3>2. Flexibility and Convenience</h3>
<p>No commuting, no rigid schedules. Students can learn from the comfort of their home, at times that suit their schedule. This is especially valuable for students balancing school, extracurriculars, and family responsibilities.</p>

<h3>3. Access to Expert Tutors</h3>
<p>Geography is no longer a barrier. A student in a rural area can access the same quality of tutoring as someone in a major city. Platforms like <strong>TutorsPool</strong> connect students with subject matter experts regardless of location.</p>

<h3>4. Technology-Enhanced Learning</h3>
<p>Digital whiteboards, screen sharing, recorded sessions, and interactive quizzes make online learning more engaging and effective. Students can revisit concepts by reviewing session recordings.</p>

<h2>The Role of AI in Modern Tutoring</h2>
<p>AI is enhancing—not replacing—human tutors. Smart platforms now use AI to:</p>
<ul>
<li>Identify knowledge gaps and recommend targeted practice</li>
<li>Generate personalized quizzes and flashcards</li>
<li>Track progress and predict areas where students might struggle</li>
<li>Match students with the most suitable tutors</li>
</ul>

<h2>Making Quality Education Accessible</h2>
<p>Perhaps the most important impact of online tutoring is <strong>democratizing education</strong>. Students who previously couldn't access quality tutoring due to cost or location now have options at every price point.</p>

<h2>Getting Started</h2>
<p>Ready to experience the future of learning? <strong>TutorsPool</strong> offers personalized online tutoring across 15+ subjects with expert tutors. Book your free demo session today and see the difference.</p>`,
      coverImage: `${origin}/blog/online-tutoring-revolution.jpg`,
      authorId,
      authorName,
      isPublished: true,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      tags: ["Online Tutoring", "EdTech", "Education Trends", "Digital Learning"],
      metaTitle: "How Online Tutoring is Revolutionizing Education in 2025",
      metaDescription: "Explore how online tutoring platforms are transforming education with AI-powered learning, personalized sessions, and expert tutors accessible from anywhere."
    },
    {
      title: "The Ultimate Guide to Choosing the Right Tutor for Your Child",
      slug: "ultimate-guide-choosing-right-tutor",
      excerpt: "Finding the perfect tutor can feel overwhelming. This comprehensive guide covers everything from qualifications to teaching style, helping you make the best decision for your child's academic success.",
      content: `<h2>Why the Right Tutor Makes All the Difference</h2>
<p>A great tutor doesn't just teach—they <strong>inspire</strong>. The right match between student and tutor can turn a struggling learner into a confident achiever. But with so many options available, how do you find that perfect fit?</p>

<h2>Step 1: Identify Your Child's Needs</h2>
<p>Before searching for a tutor, clearly define what you need:</p>
<ul>
<li><strong>Subject-specific help:</strong> Struggling with a particular subject like math or science?</li>
<li><strong>Exam preparation:</strong> Need focused prep for board exams, SAT, or other standardized tests?</li>
<li><strong>Homework support:</strong> Need daily help with assignments and coursework?</li>
<li><strong>Enrichment:</strong> Want to go beyond the curriculum and explore advanced topics?</li>
<li><strong>Confidence building:</strong> Does your child need encouragement and a safe space to ask questions?</li>
</ul>

<h2>Step 2: Check Qualifications and Experience</h2>
<p>Look for tutors who have:</p>
<ul>
<li>A relevant degree in the subject they teach</li>
<li>Prior teaching or tutoring experience</li>
<li>Knowledge of the specific curriculum your child follows</li>
<li>Positive reviews and verified credentials</li>
</ul>

<h2>Step 3: Evaluate Teaching Style</h2>
<p>Every child learns differently. The best tutor adapts their approach to match your child's learning style:</p>
<ul>
<li><strong>Visual learners</strong> benefit from diagrams, charts, and videos</li>
<li><strong>Auditory learners</strong> thrive with verbal explanations and discussions</li>
<li><strong>Kinesthetic learners</strong> need hands-on activities and real-world examples</li>
</ul>

<h2>Step 4: Start with a Trial Session</h2>
<p>Never commit long-term without a trial. A good trial session reveals:</p>
<ul>
<li>How well the tutor communicates with your child</li>
<li>Whether the tutor is patient and encouraging</li>
<li>If the tutor can explain concepts in ways your child understands</li>
<li>The overall chemistry between tutor and student</li>
</ul>

<h2>Step 5: Set Clear Goals and Track Progress</h2>
<p>Work with the tutor to establish measurable goals. Monthly check-ins help ensure your child is making progress and the tutoring approach remains effective.</p>

<h2>Red Flags to Watch For</h2>
<ul>
<li>Tutors who do homework <em>for</em> the student instead of teaching them</li>
<li>Lack of preparation or a structured lesson plan</li>
<li>Inability to explain concepts in multiple ways</li>
<li>Poor communication with parents about progress</li>
</ul>

<h2>Find Your Perfect Match</h2>
<p>At <strong>TutorsPool</strong>, every tutor is verified, experienced, and committed to your child's success. Browse our curated selection of expert tutors and book a free demo session to find the perfect match.</p>`,
      coverImage: `${origin}/blog/choosing-right-tutor.jpg`,
      authorId,
      authorName,
      isPublished: true,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      tags: ["Tutoring Tips", "Parenting", "Education Guide", "Student Success"],
      metaTitle: "How to Choose the Right Tutor: Complete Guide | TutorsPool",
      metaDescription: "Complete guide to finding the perfect tutor for your child. Learn what qualifications to look for, how to evaluate teaching styles, and red flags to avoid."
    },
    {
      title: "5 Common Math Mistakes Students Make (And How to Fix Them)",
      slug: "5-common-math-mistakes-students-how-to-fix",
      excerpt: "From sign errors to misunderstanding word problems, these are the most frequent math mistakes students make at every level—and practical strategies to overcome them for good.",
      content: `<h2>Why Math Mistakes Are Often Repeated</h2>
<p>Mathematics is cumulative—each concept builds on the previous one. When fundamental mistakes go uncorrected, they compound over time, making advanced topics feel impossible. The good news? Most math errors fall into <strong>predictable patterns</strong> that can be fixed with awareness and practice.</p>

<h2>Mistake #1: Sign Errors in Algebra</h2>
<p><strong>The problem:</strong> Students frequently lose track of positive and negative signs, especially when distributing or solving equations.</p>
<p><strong>Example:</strong> -3(x - 4) is often incorrectly expanded as -3x - 12 instead of <strong>-3x + 12</strong>.</p>
<p><strong>The fix:</strong></p>
<ul>
<li>Write out every step—don't skip mental math</li>
<li>Circle the signs before distributing</li>
<li>Use the mantra: "negative times negative equals positive"</li>
<li>Always double-check by substituting a value back into the original expression</li>
</ul>

<h2>Mistake #2: Misunderstanding Order of Operations</h2>
<p><strong>The problem:</strong> PEMDAS/BODMAS confusion, especially between multiplication/division and addition/subtraction (which are performed <em>left to right</em>, not in strict order).</p>
<p><strong>Example:</strong> 8 ÷ 2(2+2) — this creates confusion even among adults!</p>
<p><strong>The fix:</strong></p>
<ul>
<li>Remember: Multiplication and Division have <strong>equal priority</strong> (left to right)</li>
<li>Same for Addition and Subtraction</li>
<li>When in doubt, add parentheses to clarify your interpretation</li>
</ul>

<h2>Mistake #3: Fraction and Decimal Confusion</h2>
<p><strong>The problem:</strong> Students struggle with converting between fractions and decimals, and make errors when adding fractions with different denominators.</p>
<p><strong>The fix:</strong></p>
<ul>
<li>Always find a common denominator before adding or subtracting fractions</li>
<li>Practice converting common fractions to decimals until it becomes automatic</li>
<li>Use visual models (pie charts, number lines) to build intuition</li>
</ul>

<h2>Mistake #4: Not Reading Word Problems Carefully</h2>
<p><strong>The problem:</strong> Students jump to calculations without fully understanding what the problem is asking. They solve the wrong question correctly.</p>
<p><strong>The fix:</strong></p>
<ul>
<li>Read the problem <strong>twice</strong> before writing anything</li>
<li>Underline key information and circle what you need to find</li>
<li>Translate the problem into a mathematical equation step by step</li>
<li>After solving, ask: "Does my answer make sense in context?"</li>
</ul>

<h2>Mistake #5: Rounding Too Early</h2>
<p><strong>The problem:</strong> Rounding intermediate results leads to significant errors in the final answer, especially in multi-step problems.</p>
<p><strong>The fix:</strong></p>
<ul>
<li>Keep full precision throughout your calculations</li>
<li>Only round the <strong>final answer</strong> to the required decimal places</li>
<li>Use fractions instead of decimals when possible to maintain accuracy</li>
</ul>

<h2>Building Math Confidence</h2>
<p>Making mistakes is a natural part of learning math. The key is to <strong>learn from each mistake</strong> rather than fear them. Keep an error journal—write down mistakes you make and review them before tests.</p>

<p>Struggling with math? Our expert math tutors at <strong>TutorsPool</strong> specialize in identifying and correcting these common patterns, building a strong foundation that lasts.</p>`,
      coverImage: `${origin}/blog/math-mistakes.jpg`,
      authorId,
      authorName,
      isPublished: true,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      tags: ["Mathematics", "Study Tips", "Common Mistakes", "Academic Help"],
      metaTitle: "5 Common Math Mistakes Students Make & How to Fix Them",
      metaDescription: "Learn the 5 most common math mistakes students make including sign errors, order of operations confusion, and fraction problems, plus expert strategies to fix them."
    },
    {
      title: "Why Personalized Learning is the Future of Education",
      slug: "personalized-learning-future-education",
      excerpt: "One-size-fits-all education is becoming obsolete. Discover how personalized learning adapts to each student's pace, interests, and goals—and why it produces dramatically better outcomes.",
      content: `<h2>The Problem with Traditional Education</h2>
<p>In a typical classroom, a teacher delivers the same lesson to 30+ students who have different backgrounds, learning speeds, interests, and goals. Some students are bored because the pace is too slow; others are lost because it's too fast. This isn't a failure of teaching—it's a <strong>failure of the system</strong>.</p>

<h2>What is Personalized Learning?</h2>
<p>Personalized learning tailors the educational experience to each student's:</p>
<ul>
<li><strong>Learning pace:</strong> Moving faster through easy topics and spending more time on challenging ones</li>
<li><strong>Learning style:</strong> Visual, auditory, reading/writing, or kinesthetic approaches</li>
<li><strong>Interests:</strong> Connecting academic concepts to topics the student cares about</li>
<li><strong>Goals:</strong> Aligning lessons with the student's academic and career aspirations</li>
</ul>

<h2>The Evidence is Clear</h2>
<p>Research consistently shows personalized learning outperforms traditional methods:</p>
<ul>
<li>Students in personalized programs score <strong>30% higher</strong> on standardized tests</li>
<li><strong>85% of students</strong> report higher engagement and motivation</li>
<li>Learning retention increases by <strong>60%</strong> when content is personalized</li>
<li>Students develop stronger <strong>critical thinking and problem-solving</strong> skills</li>
</ul>

<h2>How Technology Enables Personalization</h2>

<h3>Adaptive Learning Platforms</h3>
<p>AI-powered platforms analyze student performance in real-time, automatically adjusting difficulty levels and recommending targeted practice. If a student masters addition quickly, the system moves them to multiplication. If they struggle with fractions, it provides additional practice and explanations.</p>

<h3>Smart Quizzes and Assessments</h3>
<p>Modern assessment tools don't just grade—they <strong>diagnose</strong>. They identify specific knowledge gaps and create customized review materials. At TutorsPool, our SmartGen Quiz system creates AI-powered assessments with flashcards tailored to each student's needs.</p>

<h3>Data-Driven Progress Tracking</h3>
<p>Teachers and parents can monitor progress with detailed analytics showing strengths, weaknesses, and improvement trends over time.</p>

<h2>The Role of Human Tutors</h2>
<p>Technology is powerful, but it can't replace the human element. The best personalized learning combines:</p>
<ul>
<li><strong>AI technology</strong> for assessment, practice, and progress tracking</li>
<li><strong>Expert tutors</strong> for mentorship, motivation, complex explanations, and emotional support</li>
</ul>
<p>A skilled tutor notices when a student is frustrated, celebrates their breakthroughs, and adjusts their teaching approach based on subtle cues that no algorithm can detect.</p>

<h2>Implementing Personalized Learning at Home</h2>
<p>You don't need expensive technology to start personalizing your child's education:</p>
<ol>
<li><strong>Understand their learning style</strong> — observe how they naturally engage with information</li>
<li><strong>Set individualized goals</strong> — work with their teacher or tutor to create specific, achievable targets</li>
<li><strong>Provide choice</strong> — let them explore topics they're curious about</li>
<li><strong>Use adaptive resources</strong> — many free apps and websites offer personalized practice</li>
<li><strong>Hire a tutor</strong> — 1-on-1 tutoring is the ultimate form of personalized learning</li>
</ol>

<h2>The Future is Personal</h2>
<p>Education is moving away from the factory model toward a learner-centered approach. Students who experience personalized learning today will be better prepared for a world that values creativity, adaptability, and continuous learning.</p>

<p>Experience personalized learning with <strong>TutorsPool</strong>. Our expert tutors create customized lesson plans for every student. Book a free demo session and see the difference personalized attention makes.</p>`,
      coverImage: `${origin}/blog/personalized-learning.jpg`,
      authorId,
      authorName,
      isPublished: true,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      tags: ["Personalized Learning", "Education Trends", "EdTech", "Future of Education"],
      metaTitle: "Why Personalized Learning is the Future of Education",
      metaDescription: "Discover why personalized learning produces 30% better outcomes than traditional education. Learn how AI, adaptive platforms, and expert tutors create tailored learning experiences."
    }
  ];

  let created = 0;
  for (const post of posts) {
    try {
      await createBlogPost(post);
      created++;
    } catch (error) {
      if (isDev) console.error('Error seeding blog post:', error);
    }
  }
  return created;
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