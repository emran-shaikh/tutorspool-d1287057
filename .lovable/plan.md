

## Plan: Add Parent Role with Silent Child Monitoring

This feature adds a new "Parent" role that can monitor their child's academic progress, sessions, quiz results, and learning goals — without the child being notified or aware of the oversight.

### How It Works

1. **Parent registers** with the "parent" role and links to their child by entering the child's email during registration or from their dashboard
2. **Linking mechanism**: Parent enters child's email → system looks up the student account → creates a `parentLinks` record in Firestore mapping parent UID to student UID
3. **Parent dashboard** shows a read-only view of the child's data: sessions, quiz results, learning goals, achievements, and gamification stats
4. **No notifications to child**: The child's UI has zero awareness of the parent link — no alerts, no indicators, no changes to their experience
5. **Email notifications to parent**: When the child completes a quiz, books/completes a session, or hits a milestone, the parent receives an email notification silently

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/dashboard/ParentDashboard.tsx` | Main parent dashboard with child overview |
| `src/pages/parent/LinkChild.tsx` | Page to link/manage child accounts |
| `src/pages/parent/ChildProgress.tsx` | Detailed view of child's sessions, goals, quiz results |
| `src/pages/parent/EditParentProfile.tsx` | Parent profile editing |

### Files to Modify

| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | Add `'parent'` to `UserRole` type |
| `src/pages/Register.tsx` | Add parent role option with "Heart" icon, remove admin from default role selector grid |
| `src/App.tsx` | Add parent routes and dashboard redirect |
| `src/components/layout/DashboardLayout.tsx` | Support `'parent'` role in layout |
| `src/lib/firestore.ts` | Add `parentLinks` collection CRUD functions, add functions to fetch child data by parent UID |
| `FIRESTORE_SECURITY_RULES.md` | Add rules for `parentLinks` collection |
| `supabase/functions/send-email/index.ts` | Add parent notification email templates |

### Firestore Collections

**`parentLinks`** — maps parent to child:
```
{
  parentId: string,      // parent's UID
  childId: string,       // student's UID
  childEmail: string,    // for display
  childName: string,     // cached name
  linkedAt: string,      // ISO timestamp
  status: 'active' | 'pending'
}
```

### Security Rules for `parentLinks`
- Parents can read/create/delete their own links (where `parentId == uid`)
- Students cannot see `parentLinks` at all (no read access for students)
- Admins have full access

### Parent Dashboard Features
- **Child Overview Card**: Name, grade, active goals count, sessions count
- **Recent Sessions**: Last 5 sessions with status
- **Quiz Results**: Scores, completion dates, subjects
- **Learning Goals**: Progress bars for each goal
- **Achievements**: XP, level, streak data
- All data is fetched using existing firestore functions (`getStudentSessions`, `getStudentGoals`, `getStudentResults`, `getStudentGamification`) but called with the child's UID

### Email Notifications (Silent)
Parent receives emails when child:
- Completes a quiz (with score summary)
- Books or completes a session
- Achieves a new level or milestone

These are triggered from existing flows (quiz completion, session updates) by checking if the student has a linked parent and sending the notification only to the parent.

### Technical Details
- The linking flow validates that the entered email belongs to an existing student account
- A parent can link multiple children
- The child's dashboard, notifications, and UI remain completely unchanged
- Parent data access reuses existing Firestore query functions, just called with the child's UID from the parent's context

