import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Session } from './firestore';
import { GroupSession, GroupSubscription } from './groupClasses';

// ============= Types =============

export type ClassroomKind = 'session' | 'group';

export interface ClassroomRoom {
  id: string; // roomId, also doc id
  kind: ClassroomKind;
  refId: string; // sessionId or groupSessionId
  tutorId: string;
  title: string;
  status: 'open' | 'ended';
  createdAt: string;
  endedAt?: string;
}

export interface ClassroomParticipant {
  id?: string;
  roomId: string;
  uid: string;
  name: string;
  role: 'tutor' | 'student' | 'admin';
  joinedAt: string;
  leftAt?: string;
  durationMinutes?: number;
}

export interface ClassroomMessage {
  id?: string;
  roomId: string;
  uid: string;
  name: string;
  text: string;
  createdAt: string;
}

export interface StrokePoint {
  x: number; // 0..1 normalised
  y: number;
}

export interface WhiteboardStroke {
  id?: string;
  roomId: string;
  uid: string;
  color: string;
  width: number;
  erase?: boolean;
  points: StrokePoint[];
  createdAt: string;
}

// ============= Room ids =============

export const roomIdForSession = (sessionId: string) => `s_${sessionId}`;
export const roomIdForGroupSession = (groupSessionId: string) => `g_${groupSessionId}`;

export const parseRoomId = (roomId: string): { kind: ClassroomKind; refId: string } | null => {
  if (roomId.startsWith('s_')) return { kind: 'session', refId: roomId.slice(2) };
  if (roomId.startsWith('g_')) return { kind: 'group', refId: roomId.slice(2) };
  return null;
};

// ============= Access =============

export interface RoomAccess {
  allowed: boolean;
  reason?: string;
  isHost: boolean;
  title: string;
  tutorId: string;
  canPublishVideo: boolean;
}

export const resolveRoomAccess = async (
  roomId: string,
  uid: string,
  role: string
): Promise<RoomAccess> => {
  const deny = (reason: string): RoomAccess => ({
    allowed: false,
    reason,
    isHost: false,
    title: 'Classroom',
    tutorId: '',
    canPublishVideo: false,
  });

  const parsed = parseRoomId(roomId);
  if (!parsed) return deny('This classroom link is not valid.');

  if (parsed.kind === 'session') {
    const snap = await getDoc(doc(db, 'sessions', parsed.refId));
    if (!snap.exists()) return deny('This class no longer exists.');
    const s = { ...(snap.data() as Session), id: snap.id };
    const isHost = s.tutorId === uid;
    const isStudent = s.studentId === uid;
    if (!isHost && !isStudent && role !== 'admin')
      return deny("You don't have access to this class.");
    return {
      allowed: true,
      isHost,
      title: `${s.subject} · ${s.studentName}`,
      tutorId: s.tutorId,
      canPublishVideo: true,
    };
  }

  const snap = await getDoc(doc(db, 'groupSessions', parsed.refId));
  if (!snap.exists()) return deny('This class no longer exists.');
  const gs = { ...(snap.data() as GroupSession), id: snap.id };
  const isHost = gs.tutorId === uid;
  if (!isHost && role !== 'admin') {
    const subs = await getDocs(
      query(
        collection(db, 'groupSubscriptions'),
        where('studentId', '==', uid),
        where('packageId', '==', gs.packageId)
      )
    );
    const active = subs.docs
      .map(d => d.data() as GroupSubscription)
      .some(s => s.status === 'active');
    if (!active) return deny('Your seat in this group class is not active yet.');
  }
  return {
    allowed: true,
    isHost,
    title: gs.topic || gs.packageTitle || 'Group class',
    tutorId: gs.tutorId,
    canPublishVideo: isHost || role === 'admin',
  };
};

// ============= Room lifecycle =============

export const ensureRoom = async (
  roomId: string,
  data: Omit<ClassroomRoom, 'id' | 'createdAt' | 'status'>
): Promise<void> => {
  const ref = doc(db, 'classrooms', roomId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      ...data,
      status: 'open',
      createdAt: new Date().toISOString(),
    });
  }
};

export const endRoom = async (roomId: string): Promise<void> => {
  await updateDoc(doc(db, 'classrooms', roomId), {
    status: 'ended',
    endedAt: new Date().toISOString(),
  }).catch(() => undefined);
};

// ============= Attendance =============

export const recordJoin = async (
  p: Omit<ClassroomParticipant, 'id' | 'joinedAt'>
): Promise<string> => {
  const ref = await addDoc(collection(db, 'classroomParticipants'), {
    ...p,
    joinedAt: new Date().toISOString(),
  });
  return ref.id;
};

/**
 * Reconnect-safe join: reuses an attendance record that was left open by a
 * dropped connection (within the last 2 hours) instead of creating duplicates.
 */
export const joinAttendance = async (
  p: Omit<ClassroomParticipant, 'id' | 'joinedAt'>
): Promise<{ id: string; joinedAt: string } | null> => {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'classroomParticipants'),
        where('roomId', '==', p.roomId),
        where('uid', '==', p.uid)
      )
    );
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    const open = snap.docs
      .map(d => ({ ...(d.data() as ClassroomParticipant), id: d.id }))
      .filter(a => !a.leftAt && new Date(a.joinedAt).getTime() > cutoff)
      .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))[0];
    if (open?.id) return { id: open.id, joinedAt: open.joinedAt };
  } catch {
    /* fall through to a fresh record */
  }
  const joinedAt = new Date().toISOString();
  try {
    const id = await recordJoin(p);
    return { id, joinedAt };
  } catch {
    return null;
  }
};


export const recordLeave = async (attendanceId: string, joinedAt: string): Promise<void> => {
  const leftAt = new Date().toISOString();
  const minutes = Math.max(
    0,
    Math.round((new Date(leftAt).getTime() - new Date(joinedAt).getTime()) / 60000)
  );
  await updateDoc(doc(db, 'classroomParticipants', attendanceId), {
    leftAt,
    durationMinutes: minutes,
  }).catch(() => undefined);
};

export const getAttendance = async (roomId: string): Promise<ClassroomParticipant[]> => {
  const snap = await getDocs(
    query(collection(db, 'classroomParticipants'), where('roomId', '==', roomId))
  );
  return snap.docs
    .map(d => ({ ...(d.data() as ClassroomParticipant), id: d.id }))
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
};

// ============= Chat =============

export const saveMessage = async (m: Omit<ClassroomMessage, 'id'>): Promise<void> => {
  await addDoc(collection(db, 'classroomMessages'), m);
};

export const getMessages = async (roomId: string): Promise<ClassroomMessage[]> => {
  const snap = await getDocs(
    query(collection(db, 'classroomMessages'), where('roomId', '==', roomId))
  );
  return snap.docs
    .map(d => ({ ...(d.data() as ClassroomMessage), id: d.id }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

// ============= Whiteboard =============

export const saveStroke = async (s: Omit<WhiteboardStroke, 'id'>): Promise<void> => {
  await addDoc(collection(db, 'classroomWhiteboard'), s);
};

export const getStrokes = async (roomId: string): Promise<WhiteboardStroke[]> => {
  const snap = await getDocs(
    query(collection(db, 'classroomWhiteboard'), where('roomId', '==', roomId))
  );
  return snap.docs
    .map(d => ({ ...(d.data() as WhiteboardStroke), id: d.id }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const clearBoard = async (roomId: string): Promise<void> => {
  const snap = await getDocs(
    query(collection(db, 'classroomWhiteboard'), where('roomId', '==', roomId))
  );
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref).catch(() => undefined)));
};
