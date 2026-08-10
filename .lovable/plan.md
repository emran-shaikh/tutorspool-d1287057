# Group Tuition Subscription Packages

Add group classes to TutorsPool: tutors propose group packages, admin approves them, students browse and subscribe, and admin activates a subscription once payment is confirmed offline. Enrolled students get scheduled group sessions with Zoom links plus quizzes and resources assigned to the whole batch.

## How it works

**Tutor**
- New "Group Classes" page: create a group package with title, subject, level, description, seat limit, weekly schedule (days + time), monthly price (USD), and type:
  - Fixed batch — set start and end dates, enrollment closes when full or when it starts.
  - Ongoing cohort — always-on, students can join any month.
- Package is submitted as `pending`; only approved packages appear publicly.
- For an approved package the tutor sees the roster, can generate a Zoom link per group session, and can assign a quiz/task/resource to every enrolled student at once.

**Admin**
- New "Group Packages" page: review pending packages (approve / reject with a note), edit price or seats, pause or archive a package.
- New "Group Subscriptions" tab: see every subscription request, mark it `active` after offline payment (WhatsApp/bank), set the paid-through date, and cancel or renew. Marking active is what grants the student access.

**Student**
- Public `/group-classes` page listing approved packages with filters by subject and level, prices shown via the existing local-currency `Price` component.
- Package detail page with tutor info, schedule, seats left, and a "Request to Join" button that creates a `pending` subscription and pings admin (existing admin notification + WhatsApp fallback).
- Dashboard section "My Group Classes" showing active subscriptions, upcoming group sessions with Zoom links, and assigned group work.

**Parent** — active group subscriptions and upcoming group sessions appear in the existing read-only child progress view.

## Technical notes

Firestore (matching existing patterns and rules style):
- `groupPackages` — tutorId, tutorName, title, subject, level, description, type (`batch` | `cohort`), seatLimit, enrolledCount, priceUsd, billingPeriod (`monthly`), schedule[], startDate/endDate (batch only), status (`pending` | `approved` | `rejected` | `paused` | `archived`), rejectionNote, createdAt.
- `groupSubscriptions` — packageId, studentId, studentName/email, tutorId, status (`pending` | `active` | `expired` | `cancelled`), paidThrough, activatedBy, createdAt.
- `groupSessions` — packageId, tutorId, scheduledAt, durationMinutes, zoomJoinUrl, status. Reuses the existing `create-zoom-meeting` edge function.
- Group work reuses `tutorAssignments` and `quizAssignments` by fanning out one doc per enrolled student, with an added `groupPackageId` field so it can be listed as group work.

Security rules (added to `FIRESTORE_SECURITY_RULES.md`):
- `groupPackages`: public read only where `status == "approved"`; tutor can create/update own while pending; admin full access.
- `groupSubscriptions`: student reads own, tutor reads by `tutorId`, only admin may set `status` to `active`.
- `groupSessions`: readable by the owning tutor, admin, and students with an active subscription; queries use `where` clauses matching the rules exactly, with sorting done client-side.

Other:
- Pricing displayed through `Price` so local currency conversion works; payment still stated as USD, settled offline.
- Nav links: "Group Classes" in the public navbar and in the student/tutor/admin dashboard sidebars.
- SEO: `/group-classes` gets Helmet meta, canonical, and `Course` JSON-LD per package; both routes added to the dynamic sitemap.
- Reuses the existing email system to notify tutor on approval and student on activation.

## Out of scope for this phase

Online recurring checkout. Everything is structured so a Stripe/Paddle subscription can later drive the same `status`/`paidThrough` fields without reworking the UI.
