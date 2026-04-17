import { getParentLinksForStudent } from './firestore';
import { supabase } from '@/integrations/supabase/client';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_PREFS, type ParentNotificationPreferences } from '@/pages/parent/NotificationPreferences';

export type ParentNotificationType =
  | 'quiz_completed'
  | 'session_booked'
  | 'session_status'
  | 'milestone';

/**
 * Fetch parent email & name from users collection
 */
async function getParentInfo(parentId: string): Promise<{ email: string; name: string } | null> {
  try {
    const snap = await getDoc(doc(db, 'users', parentId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return { email: data.email, name: data.fullName || 'Parent' };
  } catch {
    return null;
  }
}

/**
 * Fetch a parent's notification preferences (defaults to all enabled).
 */
async function getParentPrefs(parentId: string): Promise<ParentNotificationPreferences> {
  try {
    const snap = await getDoc(doc(db, 'parentNotificationPrefs', parentId));
    if (snap.exists()) {
      return { ...DEFAULT_PREFS, ...(snap.data() as ParentNotificationPreferences) };
    }
  } catch (e) {
    console.error('Failed to load parent prefs:', e);
  }
  return DEFAULT_PREFS;
}

/**
 * Persist a notification record so parents can see history in the dashboard.
 * Fire-and-forget — never throws.
 */
async function recordNotification(
  parentId: string,
  childId: string,
  childName: string,
  type: ParentNotificationType,
  title: string,
  message: string,
  meta: Record<string, unknown> = {}
) {
  try {
    await addDoc(collection(db, 'parentNotifications'), {
      parentId,
      childId,
      childName,
      type,
      title,
      message,
      meta,
      read: false,
      createdAt: serverTimestamp(),
      createdAtIso: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Failed to record parent notification:', e);
  }
}

export async function notifyParentsOfQuizCompletion(
  studentId: string,
  studentName: string,
  quizTopic: string,
  subject: string,
  accuracy: number,
  correctAnswers: number,
  totalQuestions: number
) {
  try {
    const links = await getParentLinksForStudent(studentId);
    if (!links.length) return;

    await Promise.allSettled(
      links.map(async (link) => {
        const parent = await getParentInfo(link.parentId);
        await recordNotification(
          link.parentId,
          studentId,
          studentName,
          'quiz_completed',
          `Quiz completed — ${accuracy}%`,
          `${studentName} scored ${accuracy}% on "${quizTopic}" (${subject})`,
          { quizTopic, subject, accuracy, correctAnswers, totalQuestions }
        );
        if (!parent?.email) return;
        return supabase.functions.invoke('send-email', {
          body: {
            type: 'parent_quiz_completed',
            to: parent.email,
            parentName: parent.name,
            childName: studentName,
            quizTopic,
            subject,
            accuracy,
            correctAnswers,
            totalQuestions,
          },
        });
      })
    );
  } catch (e) {
    console.error('Silent parent notification (quiz) failed:', e);
  }
}

export async function notifyParentsOfSessionBooked(
  studentId: string,
  studentName: string,
  tutorName: string,
  subject: string,
  date: string,
  time: string
) {
  try {
    const links = await getParentLinksForStudent(studentId);
    if (!links.length) return;

    await Promise.allSettled(
      links.map(async (link) => {
        const parent = await getParentInfo(link.parentId);
        await recordNotification(
          link.parentId,
          studentId,
          studentName,
          'session_booked',
          'New session booked',
          `${studentName} booked a session with ${tutorName} for ${subject} on ${date} at ${time}`,
          { tutorName, subject, date, time }
        );
        if (!parent?.email) return;
        return supabase.functions.invoke('send-email', {
          body: {
            type: 'parent_session_booked',
            to: parent.email,
            parentName: parent.name,
            childName: studentName,
            tutorName,
            subject,
            date,
            time,
          },
        });
      })
    );
  } catch (e) {
    console.error('Silent parent notification (session) failed:', e);
  }
}

export async function notifyParentsOfSessionStatus(
  studentId: string,
  studentName: string,
  tutorName: string,
  subject: string,
  date: string,
  time: string,
  status: 'accepted' | 'declined' | 'completed' | 'cancelled'
) {
  try {
    const links = await getParentLinksForStudent(studentId);
    if (!links.length) return;

    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

    await Promise.allSettled(
      links.map(async (link) => {
        const parent = await getParentInfo(link.parentId);
        await recordNotification(
          link.parentId,
          studentId,
          studentName,
          'session_status',
          `Session ${status}`,
          `${studentName}'s session with ${tutorName} (${subject}) on ${date} at ${time} was ${status}.`,
          { tutorName, subject, date, time, status }
        );
        if (!parent?.email) return;
        return supabase.functions.invoke('send-email', {
          body: {
            type: 'parent_session_status',
            to: parent.email,
            parentName: parent.name,
            childName: studentName,
            tutorName,
            subject,
            date,
            time,
            status,
          },
        });
      })
    );
  } catch (e) {
    console.error('Silent parent notification (session status) failed:', e);
  }
}

export async function notifyParentsOfMilestone(
  studentId: string,
  studentName: string,
  milestoneTitle: string,
  milestoneDescription: string
) {
  try {
    const links = await getParentLinksForStudent(studentId);
    if (!links.length) return;

    await Promise.allSettled(
      links.map(async (link) => {
        const parent = await getParentInfo(link.parentId);
        await recordNotification(
          link.parentId,
          studentId,
          studentName,
          'milestone',
          milestoneTitle,
          `${studentName}: ${milestoneDescription}`,
          { milestoneTitle, milestoneDescription }
        );
        if (!parent?.email) return;
        return supabase.functions.invoke('send-email', {
          body: {
            type: 'parent_milestone',
            to: parent.email,
            parentName: parent.name,
            childName: studentName,
            milestoneTitle,
            milestoneDescription,
          },
        });
      })
    );
  } catch (e) {
    console.error('Silent parent notification (milestone) failed:', e);
  }
}
