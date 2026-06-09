
# Lifecycle & Engagement Email Automation

Goal: gently keep Students, Tutors, and Parents engaged by emailing only the users who need a nudge for their *next concrete step* — never blast everyone. Frequency capped so it feels helpful, not spammy.

## Targeting Rules (who gets what)

### Tutors
| Trigger | Condition | Email | Cadence |
|---|---|---|---|
| Profile incomplete | Missing photo / subjects / bio / availability / hourly rate | "Finish your tutor profile to start receiving students" | Day 1, Day 3, Day 7, then every 7 days (max 4 total) |
| Approved but no availability set | `isApproved=true` & no availability slots | "Add availability so students can book you" | Day 1, Day 4 (max 2) |
| No sessions in 14 days | Active tutor, last session > 14d | "Your students miss you — log back in" | Once per 14d window |
| New assignment opportunity | Student connected but tutor hasn't assigned anything in 7d | "Assign a task or quiz to {studentName}" | Weekly |

### Students
| Trigger | Condition | Email | Cadence |
|---|---|---|---|
| Profile incomplete | Missing grade / subjects of interest | "Complete your profile to get matched" | Day 1, Day 3, Day 7 (max 3) |
| Registered but no tutor browsed | No `FindTutors` visit & no booking in 3d | "Browse tutors for your subjects" | Day 3, Day 7 (max 2) |
| No session booked | Profile complete, no booking in 7d | "Book your first session — 50% off demo" | Day 7, Day 14 (max 2) |
| Quiz assigned, not attempted | `quizAssignments.status=pending` > 2d | "Your tutor assigned you a quiz" | Day 2, Day 5 |
| Streak about to break | Streak ≥ 3, no activity today (evening) | "Don't break your {n}-day streak!" | Daily at 7 PM |
| Inactive 14d | No login 14d | "Pick up where you left off" | Once per 14d |

### Parents
| Trigger | Condition | Email | Cadence |
|---|---|---|---|
| Linked but no child progress viewed | `parentLinks` exists, no `ChildProgress` visit in 7d | "See your child's weekly progress" | Weekly digest (Sun) |
| Weekly digest | Active link | Auto-summary of child's sessions/quizzes | Weekly (Sun 6 PM) |

## Universal Rules

- **Suppression**: don't email if user emailed in last 48h (any lifecycle category), or if user opted out.
- **Unsubscribe**: each lifecycle email has a one-click unsubscribe → writes `emailPreferences.lifecycle=false` in user doc.
- **Hard cap**: max 2 lifecycle emails per user per week.
- **Verified email only**: skip unverified accounts.
- **Quiet hours**: send 9 AM – 8 PM in user's timezone (fallback Asia/Karachi).

## Technical Design

### New Firestore collections
- `emailLog/{id}`: `{userId, type, sentAt, status}` — used for cadence/suppression checks.
- `emailPreferences` field on `users` doc: `{lifecycle: boolean, digest: boolean, unsubscribedAt?}`.

### New Edge Function: `lifecycle-emails`
- Runs on a schedule (pg_cron, hourly).
- For each rule above:
  1. Query Firestore for matching users (via Firebase Admin SDK using existing service patterns, or via a small Firestore REST call with service account).
  2. Check `emailLog` for cadence + 48h suppression + weekly cap.
  3. Check `emailPreferences.lifecycle !== false`.
  4. Call existing `send-email` function with the right template `type`.
  5. Write `emailLog` entry.

### New email templates (added to `send-email/index.ts`)
- `tutor_profile_incomplete`
- `tutor_no_availability`
- `tutor_inactive`
- `tutor_assign_nudge`
- `student_profile_incomplete`
- `student_browse_nudge`
- `student_book_nudge`
- `student_quiz_pending`
- `student_streak_save`
- `student_inactive`
- `parent_view_progress`
- `parent_weekly_digest`

All templates keep existing role-themed styling (Blue=Student, Emerald=Tutor, Purple=Admin/Parent) and include the standard footer + unsubscribe link.

### Unsubscribe endpoint
- New Edge Function `email-unsubscribe?uid=...&token=...` → toggles `emailPreferences.lifecycle=false`. Token is HMAC of uid + secret.

### Cron schedule (pg_cron + pg_net)
- `lifecycle-emails` hourly (handles all triggers; each trigger checks its own time-of-day rules).
- `parent-weekly-digest` Sundays 18:00 Asia/Karachi.
- `student-streak-save` daily 19:00 Asia/Karachi.

### Admin controls (optional Phase 2)
- Page `src/pages/admin/EmailCampaigns.tsx`: toggle each rule on/off, view send counts, see `emailLog` last 7 days.

## Rollout Plan

1. Add `emailPreferences` field + unsubscribe edge function + token signing secret.
2. Extend `send-email` with 12 new templates (reuse existing themed layout).
3. Build `lifecycle-emails` edge function with all rule evaluators (modular: one function per rule).
4. Add `emailLog` collection + Firestore rules (admin-only read; service write).
5. Wire pg_cron schedules (hourly + 2 dailies).
6. (Phase 2) Admin dashboard page + per-rule toggles.

## Out of Scope (for now)
- A/B testing copy
- SMS/WhatsApp nudges (already covered by chatbot escalation)
- Re-engagement of fully-churned users (>60d) — needs separate win-back campaign

Approve and I'll implement in the order above.
