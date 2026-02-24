import { doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, orderBy, limit as firestoreLimit, getDocs, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ── Types ──────────────────────────────────────────────────────────────────

export interface StudentGamification {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  longestStreak: number;
  badges: string[];
  sessionsCompleted: number;
  quizzesCompleted: number;
  goalsCompleted: number;
  totalStudyHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface XPTransaction {
  id?: string;
  studentId: string;
  type: 'session_completed' | 'quiz_completed' | 'goal_achieved' | 'streak_bonus' | 'login_bonus' | 'perfect_quiz';
  xpAmount: number;
  description: string;
  createdAt: string;
}

// ── Levels ─────────────────────────────────────────────────────────────────

export const LEVELS = [
  { level: 1, title: 'Beginner', xpRequired: 0 },
  { level: 2, title: 'Learner', xpRequired: 100 },
  { level: 3, title: 'Explorer', xpRequired: 300 },
  { level: 4, title: 'Achiever', xpRequired: 600 },
  { level: 5, title: 'Scholar', xpRequired: 1000 },
  { level: 6, title: 'Expert', xpRequired: 1500 },
  { level: 7, title: 'Master', xpRequired: 2500 },
  { level: 8, title: 'Champion', xpRequired: 4000 },
  { level: 9, title: 'Legend', xpRequired: 6000 },
  { level: 10, title: 'Grandmaster', xpRequired: 10000 },
];

export function calculateLevel(xp: number): { level: number; title: string; xpRequired: number; nextLevelXp: number; progress: number } {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xpRequired) current = l;
    else break;
  }
  const nextLevel = LEVELS.find(l => l.level === current.level + 1);
  const nextLevelXp = nextLevel?.xpRequired ?? current.xpRequired;
  const xpInLevel = xp - current.xpRequired;
  const xpNeeded = nextLevelXp - current.xpRequired;
  const progress = xpNeeded > 0 ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;
  return { ...current, nextLevelXp, progress };
}

// ── Badges ─────────────────────────────────────────────────────────────────

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
}

export const BADGES: BadgeDefinition[] = [
  { id: 'first_steps', name: 'First Steps', description: 'Complete your first session', icon: '👣', tier: 'bronze' },
  { id: 'quiz_whiz', name: 'Quiz Whiz', description: 'Complete 5 quizzes', icon: '🧠', tier: 'silver' },
  { id: 'perfect_score', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '💯', tier: 'gold' },
  { id: 'goal_getter', name: 'Goal Getter', description: 'Complete your first learning goal', icon: '🎯', tier: 'bronze' },
  { id: 'streak_starter', name: 'Streak Starter', description: '3-day streak', icon: '🔥', tier: 'bronze' },
  { id: 'week_warrior', name: 'Week Warrior', description: '7-day streak', icon: '⚔️', tier: 'silver' },
  { id: 'monthly_master', name: 'Monthly Master', description: '30-day streak', icon: '👑', tier: 'gold' },
  { id: 'session_pro', name: 'Session Pro', description: 'Complete 10 sessions', icon: '🎓', tier: 'silver' },
  { id: 'knowledge_seeker', name: 'Knowledge Seeker', description: 'Complete 25 quizzes', icon: '📚', tier: 'gold' },
  { id: 'dedicated_learner', name: 'Dedicated Learner', description: 'Reach Level 5', icon: '⭐', tier: 'silver' },
  { id: 'top_scholar', name: 'Top Scholar', description: 'Reach Level 10', icon: '🏆', tier: 'gold' },
];

// ── Firestore CRUD ─────────────────────────────────────────────────────────

export async function getStudentGamification(studentId: string): Promise<StudentGamification | null> {
  const snap = await getDoc(doc(db, 'studentGamification', studentId));
  return snap.exists() ? (snap.data() as StudentGamification) : null;
}

export async function initializeGamification(studentId: string): Promise<StudentGamification> {
  const existing = await getStudentGamification(studentId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const initial: StudentGamification = {
    xp: 0, level: 1, streak: 0, lastActiveDate: '', longestStreak: 0,
    badges: [], sessionsCompleted: 0, quizzesCompleted: 0, goalsCompleted: 0,
    totalStudyHours: 0, createdAt: now, updatedAt: now,
  };
  await setDoc(doc(db, 'studentGamification', studentId), initial);
  return initial;
}

export async function awardXP(
  studentId: string,
  type: XPTransaction['type'],
  xpAmount: number,
  description: string,
  statIncrement?: Partial<Pick<StudentGamification, 'sessionsCompleted' | 'quizzesCompleted' | 'goalsCompleted' | 'totalStudyHours'>>
): Promise<{ newXP: number; newLevel: number; badgesEarned: string[] }> {
  // Ensure gamification record exists
  await initializeGamification(studentId);

  const ref = doc(db, 'studentGamification', studentId);

  // Build update object
  const updates: Record<string, any> = {
    xp: increment(xpAmount),
    updatedAt: new Date().toISOString(),
  };
  if (statIncrement) {
    for (const [key, val] of Object.entries(statIncrement)) {
      if (val) updates[key] = increment(val);
    }
  }
  await updateDoc(ref, updates);

  // Log transaction
  await addDoc(collection(db, 'xpTransactions'), {
    studentId, type, xpAmount, description, createdAt: new Date().toISOString(),
  });

  // Re-read to get new totals
  const updated = (await getDoc(ref)).data() as StudentGamification;
  const levelInfo = calculateLevel(updated.xp);

  // Update level if changed
  if (levelInfo.level !== updated.level) {
    await updateDoc(ref, { level: levelInfo.level });
  }

  // Check badges
  const badgesEarned = await checkAndAwardBadges(studentId, { ...updated, level: levelInfo.level });

  return { newXP: updated.xp, newLevel: levelInfo.level, badgesEarned };
}

export async function checkAndAwardBadges(studentId: string, stats: StudentGamification): Promise<string[]> {
  const earned: string[] = [];
  const checks: [string, boolean][] = [
    ['first_steps', stats.sessionsCompleted >= 1],
    ['quiz_whiz', stats.quizzesCompleted >= 5],
    ['goal_getter', stats.goalsCompleted >= 1],
    ['streak_starter', stats.longestStreak >= 3],
    ['week_warrior', stats.longestStreak >= 7],
    ['monthly_master', stats.longestStreak >= 30],
    ['session_pro', stats.sessionsCompleted >= 10],
    ['knowledge_seeker', stats.quizzesCompleted >= 25],
    ['dedicated_learner', stats.level >= 5],
    ['top_scholar', stats.level >= 10],
    // perfect_score is awarded inline during quiz submission
  ];

  for (const [badgeId, condition] of checks) {
    if (condition && !stats.badges.includes(badgeId)) {
      earned.push(badgeId);
    }
  }

  if (earned.length > 0) {
    const ref = doc(db, 'studentGamification', studentId);
    await updateDoc(ref, {
      badges: [...stats.badges, ...earned],
      updatedAt: new Date().toISOString(),
    });
  }

  return earned;
}

export async function updateStreak(studentId: string): Promise<{ streak: number; xpAwarded: number }> {
  await initializeGamification(studentId);
  const ref = doc(db, 'studentGamification', studentId);
  const data = (await getDoc(ref)).data() as StudentGamification;

  const today = new Date().toISOString().split('T')[0];
  if (data.lastActiveDate === today) return { streak: data.streak, xpAwarded: 0 };

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let newStreak = data.lastActiveDate === yesterday ? data.streak + 1 : 1;
  const longestStreak = Math.max(newStreak, data.longestStreak);

  await updateDoc(ref, {
    streak: newStreak,
    longestStreak,
    lastActiveDate: today,
    updatedAt: new Date().toISOString(),
  });

  // Award streak XP
  let xpAwarded = 10; // daily login bonus
  let desc = 'Daily login bonus';

  if (newStreak === 7) { xpAwarded += 50; desc = '7-day streak bonus!'; }
  else if (newStreak === 30) { xpAwarded += 200; desc = '30-day streak bonus!'; }

  await addDoc(collection(db, 'xpTransactions'), {
    studentId, type: 'streak_bonus' as const, xpAmount: xpAwarded, description: desc, createdAt: new Date().toISOString(),
  });
  await updateDoc(ref, { xp: increment(xpAwarded) });

  // Re-check level
  const fresh = (await getDoc(ref)).data() as StudentGamification;
  const lvl = calculateLevel(fresh.xp);
  if (lvl.level !== fresh.level) await updateDoc(ref, { level: lvl.level });

  // Check badges for streak
  await checkAndAwardBadges(studentId, { ...fresh, longestStreak, streak: newStreak, level: lvl.level });

  return { streak: newStreak, xpAwarded };
}

export async function getXPHistory(studentId: string, count = 20): Promise<XPTransaction[]> {
  const q = query(
    collection(db, 'xpTransactions'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc'),
    firestoreLimit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as XPTransaction));
}

export async function getLeaderboard(count = 10): Promise<(StudentGamification & { id: string; fullName?: string })[]> {
  const q = query(
    collection(db, 'studentGamification'),
    orderBy('xp', 'desc'),
    firestoreLimit(count)
  );
  const snap = await getDocs(q);
  const entries = snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentGamification & { id: string; fullName?: string }));

  // Fetch names
  for (const entry of entries) {
    try {
      const userDoc = await getDoc(doc(db, 'users', entry.id));
      if (userDoc.exists()) entry.fullName = userDoc.data().fullName;
    } catch { /* ignore */ }
  }
  return entries;
}
