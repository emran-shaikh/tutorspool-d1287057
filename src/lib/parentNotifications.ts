import { getParentLinksForStudent } from './firestore';
import { supabase } from '@/integrations/supabase/client';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

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
 * Silently notify all linked parents about a child's activity.
 * Fire-and-forget — never throws, never shows UI to the student.
 */
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
