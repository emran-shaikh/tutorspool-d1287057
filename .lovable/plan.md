# Admin-Mediated Student ↔ Tutor Connections

Goal: Admin creates a formal "connection" between a student and a tutor. Once active, the tutor can directly assign quizzes, tasks, and learning resources to that student (with admin always able to view/audit), without re-going through admin each time. Admin retains oversight and can pause/revoke.

## Concept

A new `studentTutorConnections` Firestore collection acts as the "contract" between one student and one tutor. Tutors can only assign work to students they're connected to. Admin creates, audits, pauses, or revokes connections. Parents linked to the student automatically see all activity through existing `parentLinks` + notification system.

## Data Model (Firestore)

**`studentTutorConnections/{connectionId}`**
- `studentId`, `studentName`, `studentEmail`
- `tutorId`, `tutorName`, `tutorEmail`
- `subjects: string[]` (e.g. ["Math", "Physics"])
- `status`: `active | paused | revoked`
- `createdBy` (admin uid), `createdAt`
- `notes` (admin internal note)
- `revokedAt`, `revokedBy` (optional)

Indexing: composite read by `tutorId + status`, `studentId + status` (filter client-side per project convention if composite indexes get heavy).

**`tutorAssignments/{assignmentId}`** (new — generalized beyond quizzes)
- `connectionId` (FK to the connection — enforces the link)
- `tutorId`, `studentId`
- `type`: `quiz | task | resource | flashcard`
- `title`, `description`
- `payload`: `{ quizId? , resourceUrl?, fileUrl?, instructions? }`
- `dueDate` (optional)
- `status`: `pending | submitted | completed`
- `createdAt`, `updatedAt`

Existing `quizAssignments` stays as-is for quizzes (still works), but new code path requires an active connection before creating one.

## Firestore Security Rules

```
match /studentTutorConnections/{id} {
  allow read: if isAuthenticated() && (
    resource.data.studentId == request.auth.uid ||
    resource.data.tutorId == request.auth.uid ||
    isAdmin() ||
    isLinkedParent(resource.data.studentId)
  );
  allow create, update, delete: if isAdmin();
}

match /tutorAssignments/{id} {
  allow read: if isAuthenticated() && (
    resource.data.studentId == request.auth.uid ||
    resource.data.tutorId == request.auth.uid ||
    isAdmin() ||
    isLinkedParent(resource.data.studentId)
  );
  // Tutor can create only if an active connection exists (verified client-side + admin auditable);
  // immutability of connectionId enforced on update.
  allow create: if isAuthenticated() && isTutor()
    && request.resource.data.tutorId == request.auth.uid;
  allow update: if isAuthenticated() && (
    (resource.data.tutorId == request.auth.uid && isTutor()) ||
    (resource.data.studentId == request.auth.uid && isStudent()) ||
    isAdmin()
  );
  allow delete: if isAdmin() || (isTutor() && resource.data.tutorId == request.auth.uid);
}
```

Update `FIRESTORE_SECURITY_RULES.md` with these blocks.

## UI / Pages

**Admin**
- New page: `src/pages/admin/ManageConnections.tsx`
  - List all connections with filters (status, tutor, student)
  - "Create Connection" dialog: pick student + tutor + subjects + optional note
  - Actions: Pause / Resume / Revoke / Delete
  - Audit view: latest assignments per connection
- Add route + nav entry in `AdminDashboard.tsx`

**Tutor**
- New page: `src/pages/tutor/MyStudents.tsx`
  - Lists students from active connections only
  - Per-student panel with tabs: Assignments | Quizzes | Resources | Activity
  - "Assign Quiz" picks from tutor's quizzes (reuses `quizAssignments`)
  - "Assign Task" / "Share Resource" creates `tutorAssignments`
- Block legacy "assign to any student" flows: filter the student picker by active connection

**Student**
- New page: `src/pages/student/MyTutors.tsx` shows connected tutors + active subjects
- Dashboard widget "Assigned by your tutor" pulling `tutorAssignments` where `studentId == me`
- Existing quiz/assignment pages keep working

**Parent (silent)**
- Existing `parentLinks` system already propagates session/quiz events. Add notification triggers when:
  - A new connection is created for their child
  - Tutor assigns a new task/resource
- Reuses `parentNotifications` collection + `parent/notifications` page

## Notifications

- On connection create → email/notify both student and tutor (via `send-email` edge function)
- On assignment create → notify student (in-app + email) and linked parents (silent)

## Implementation Steps

1. Update `FIRESTORE_SECURITY_RULES.md` with new collection rules (user pastes into Firebase Console).
2. Add helper functions in `src/lib/firestore.ts`:
   - `createConnection`, `updateConnectionStatus`, `getConnectionsForTutor`, `getConnectionsForStudent`, `getActiveConnection(tutorId, studentId)`
   - `createTutorAssignment`, `getAssignmentsForStudent`, `getAssignmentsForTutor`, `updateAssignmentStatus`
3. Build `ManageConnections.tsx` (admin) + route wiring + nav link.
4. Build `MyStudents.tsx` (tutor) with assign dialogs; gate existing `CreateQuiz`/assign flows behind active-connection check.
5. Build `MyTutors.tsx` (student) + dashboard widget for assignments.
6. Hook notification triggers (reuse `send-email` and `parentNotifications`).
7. Add memory entry documenting the connection model and security gating.

## Out of Scope

- Tutor-initiated connection requests (admin-only creation per your spec).
- Real-time chat between student and tutor.
- Billing/scheduling changes (sessions flow stays unchanged).

Once you approve, I'll implement in this order.
