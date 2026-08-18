import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

const isDev = import.meta.env.DEV;

// ============= Types =============

export type CourseStatus = 'draft' | 'published' | 'archived';
export type LessonType = 'video' | 'text' | 'file';
export type EnrollmentStatus = 'pending' | 'active' | 'cancelled' | 'refunded';

/** Default platform commission (%) applied to a new course. */
export const DEFAULT_COMMISSION_RATE = 20;

export interface Course {
  id?: string;
  tutorId: string;
  tutorName: string;
  tutorEmail?: string;
  title: string;
  subject: string;
  level: string;
  coverImageUrl?: string;
  shortDescription?: string;
  description?: string;
  outcomes?: string[];
  priceUsd: number;
  status: CourseStatus;
  enrolledCount: number;
  salesTotalUsd: number;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseLesson {
  id?: string;
  courseId: string;
  tutorId: string;
  sectionTitle: string;
  title: string;
  type: LessonType;
  videoUrl?: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  durationMinutes?: number;
  order: number;
  isFreePreview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseEnrollment {
  id?: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  tutorId: string;
  tutorName?: string;
  status: EnrollmentStatus;
  priceUsd: number;
  amountPaidUsd?: number;
  commissionUsd?: number;
  tutorEarningsUsd?: number;
  commissionRate?: number;
  payoutPaid?: boolean;
  activatedBy?: string;
  paidAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgress {
  id?: string; // `${studentId}_${courseId}`
  studentId: string;
  courseId: string;
  completedLessonIds: string[];
  lastLessonId?: string;
  updatedAt: string;
}

export const COURSE_LEVELS = [
  'Beginner',
  'Primary',
  'Middle School',
  'High School',
  'O / A Levels',
  'University',
  'Test Prep',
  'Advanced',
];

const sortByCreated = <T extends { createdAt: string }>(items: T[]) =>
  [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

// ============= Courses =============

export const createCourse = async (
  course: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'enrolledCount' | 'salesTotalUsd'>
): Promise<string> => {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, 'courses'), {
    ...course,
    enrolledCount: 0,
    salesTotalUsd: 0,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
};

export const updateCourse = async (courseId: string, data: Partial<Course>): Promise<void> => {
  await updateDoc(doc(db, 'courses', courseId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  await deleteDoc(doc(db, 'courses', courseId));
};

/** Public listing — only published courses (matches security rules). */
export const getPublishedCourses = async (): Promise<Course[]> => {
  try {
    const q = query(collection(db, 'courses'), where('status', '==', 'published'));
    const snap = await getDocs(q);
    return sortByCreated(snap.docs.map(d => ({ ...d.data(), id: d.id } as Course)));
  } catch (e) {
    if (isDev) console.error('Error fetching courses:', e);
    return [];
  }
};

export const getCourse = async (courseId: string): Promise<Course | null> => {
  try {
    const snap = await getDoc(doc(db, 'courses', courseId));
    return snap.exists() ? ({ ...snap.data(), id: snap.id } as Course) : null;
  } catch (e) {
    if (isDev) console.error('Error fetching course:', e);
    return null;
  }
};

export const getCoursesForTutor = async (tutorId: string): Promise<Course[]> => {
  try {
    const q = query(collection(db, 'courses'), where('tutorId', '==', tutorId));
    const snap = await getDocs(q);
    return sortByCreated(snap.docs.map(d => ({ ...d.data(), id: d.id } as Course)));
  } catch (e) {
    if (isDev) console.error('Error fetching tutor courses:', e);
    return [];
  }
};

/** Admin only. */
export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const snap = await getDocs(collection(db, 'courses'));
    return sortByCreated(snap.docs.map(d => ({ ...d.data(), id: d.id } as Course)));
  } catch (e) {
    if (isDev) console.error('Error fetching all courses:', e);
    return [];
  }
};

// ============= Lessons =============

const sortLessons = (lessons: CourseLesson[]) =>
  [...lessons].sort((a, b) => (a.order || 0) - (b.order || 0));

export const createLesson = async (
  lesson: Omit<CourseLesson, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, 'courseLessons'), {
    ...lesson,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
};

export const updateLesson = async (lessonId: string, data: Partial<CourseLesson>): Promise<void> => {
  await updateDoc(doc(db, 'courseLessons', lessonId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteLesson = async (lessonId: string): Promise<void> => {
  await deleteDoc(doc(db, 'courseLessons', lessonId));
};

/** Full curriculum — for the owning tutor, admin, or an enrolled student. */
export const getLessonsForCourse = async (courseId: string): Promise<CourseLesson[]> => {
  try {
    const q = query(collection(db, 'courseLessons'), where('courseId', '==', courseId));
    const snap = await getDocs(q);
    return sortLessons(snap.docs.map(d => ({ ...d.data(), id: d.id } as CourseLesson)));
  } catch (e) {
    if (isDev) console.error('Error fetching lessons:', e);
    return [];
  }
};

/** Public — only lessons marked as free preview (matches security rules). */
export const getPreviewLessons = async (courseId: string): Promise<CourseLesson[]> => {
  try {
    const q = query(
      collection(db, 'courseLessons'),
      where('courseId', '==', courseId),
      where('isFreePreview', '==', true)
    );
    const snap = await getDocs(q);
    return sortLessons(snap.docs.map(d => ({ ...d.data(), id: d.id } as CourseLesson)));
  } catch (e) {
    if (isDev) console.error('Error fetching preview lessons:', e);
    return [];
  }
};

// ============= Enrollments =============

export const requestEnrollment = async (
  enrollment: Omit<CourseEnrollment, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> => {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, 'courseEnrollments'), {
    ...enrollment,
    status: 'pending' as EnrollmentStatus,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
};

export const updateEnrollment = async (
  enrollmentId: string,
  data: Partial<CourseEnrollment>
): Promise<void> => {
  await updateDoc(doc(db, 'courseEnrollments', enrollmentId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteEnrollment = async (enrollmentId: string): Promise<void> => {
  await deleteDoc(doc(db, 'courseEnrollments', enrollmentId));
};

export const getEnrollmentsForStudent = async (studentId: string): Promise<CourseEnrollment[]> => {
  try {
    const q = query(collection(db, 'courseEnrollments'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    return sortByCreated(snap.docs.map(d => ({ ...d.data(), id: d.id } as CourseEnrollment)));
  } catch (e) {
    if (isDev) console.error('Error fetching student enrollments:', e);
    return [];
  }
};

export const getEnrollmentsForTutor = async (tutorId: string): Promise<CourseEnrollment[]> => {
  try {
    const q = query(collection(db, 'courseEnrollments'), where('tutorId', '==', tutorId));
    const snap = await getDocs(q);
    return sortByCreated(snap.docs.map(d => ({ ...d.data(), id: d.id } as CourseEnrollment)));
  } catch (e) {
    if (isDev) console.error('Error fetching tutor enrollments:', e);
    return [];
  }
};

export const getAllEnrollments = async (): Promise<CourseEnrollment[]> => {
  try {
    const snap = await getDocs(collection(db, 'courseEnrollments'));
    return sortByCreated(snap.docs.map(d => ({ ...d.data(), id: d.id } as CourseEnrollment)));
  } catch (e) {
    if (isDev) console.error('Error fetching enrollments:', e);
    return [];
  }
};

// ============= Progress =============

const progressId = (studentId: string, courseId: string) => `${studentId}_${courseId}`;

export const getCourseProgress = async (
  studentId: string,
  courseId: string
): Promise<CourseProgress | null> => {
  try {
    const snap = await getDoc(doc(db, 'courseProgress', progressId(studentId, courseId)));
    return snap.exists() ? ({ ...snap.data(), id: snap.id } as CourseProgress) : null;
  } catch (e) {
    if (isDev) console.error('Error fetching course progress:', e);
    return null;
  }
};

export const setLessonCompleted = async (
  studentId: string,
  courseId: string,
  lessonId: string,
  completed: boolean
): Promise<string[]> => {
  const existing = await getCourseProgress(studentId, courseId);
  const current = new Set(existing?.completedLessonIds || []);
  if (completed) current.add(lessonId);
  else current.delete(lessonId);
  const completedLessonIds = Array.from(current);

  await setDoc(
    doc(db, 'courseProgress', progressId(studentId, courseId)),
    {
      studentId,
      courseId,
      completedLessonIds,
      lastLessonId: lessonId,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  return completedLessonIds;
};

// ============= Helpers =============

export const splitRevenue = (amountUsd: number, commissionRate: number) => {
  const rate = Math.min(100, Math.max(0, commissionRate ?? DEFAULT_COMMISSION_RATE));
  const commissionUsd = Math.round(amountUsd * rate) / 100;
  return {
    commissionRate: rate,
    commissionUsd,
    tutorEarningsUsd: Math.round((amountUsd - commissionUsd) * 100) / 100,
  };
};

export const lessonCountLabel = (lessons: CourseLesson[]) =>
  `${lessons.length} lesson${lessons.length === 1 ? '' : 's'}`;

export const groupBySection = (lessons: CourseLesson[]) => {
  const map = new Map<string, CourseLesson[]>();
  lessons.forEach(l => {
    const key = l.sectionTitle?.trim() || 'Course content';
    map.set(key, [...(map.get(key) || []), l]);
  });
  return Array.from(map.entries());
};
