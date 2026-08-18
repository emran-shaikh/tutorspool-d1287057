# Tutor Course Marketplace

Let approved tutors publish and sell self-paced courses (video lessons + downloadable materials). Students request enrollment, admin confirms offline payment to unlock access, and the platform tracks commission split per sale.

## How it works

**Tutor**
- New "My Courses" page (`/tutor/courses`): create a course with title, subject, level, cover image, short + full description, price (USD), and what students will learn.
- Curriculum builder: sections with lessons. Each lesson can be a video (hosted URL — YouTube/Vimeo/direct link), a text lesson, or an attached downloadable file (PDF/notes). Lessons can be marked "free preview".
- Publish instantly (no admin approval), or keep as draft. Tutor can unpublish/archive anytime.
- Course dashboard: enrolled students, pending enrollment requests, sales count, gross revenue, platform commission, and net tutor earnings.

**Student**
- Public `/courses` page: browse published courses with subject/level filters, prices shown through the existing `Price` component (local currency, charged in USD).
- Course detail page `/courses/:courseId`: tutor info, curriculum outline, free-preview lessons playable, and an "Enroll" button that creates a `pending` enrollment and pings admin (existing admin notification + WhatsApp fallback), same flow as group classes.
- Once admin marks the enrollment `active`, the course appears under `/student/courses` with a lesson player, progress tracking (completed lessons), and downloads.

**Admin**
- New "Courses" page (`/admin/courses`): all courses with the ability to unpublish/remove a course, and a global + per-course commission rate.
- "Enrollments" tab: approve (activate) an enrollment after offline payment, record amount paid, or cancel/refund it. Activation is what grants access.
- Revenue view: per-tutor totals of gross sales, platform commission, tutor payout owed, and payouts already marked paid.

## Technical notes

Firestore collections (mirroring `src/lib/groupClasses.ts` patterns, new `src/lib/courses.ts`):
- `courses` — tutorId, tutorName, title, slug, subject, level, coverImageUrl, shortDescription, description, outcomes[], priceUsd, status (`draft` | `published` | `archived`), enrolledCount, salesTotalUsd, commissionRate, createdAt/updatedAt.
- `courseLessons` — courseId, tutorId, sectionTitle, title, type (`video` | `text` | `file`), videoUrl, content, fileUrl/fileName, durationMinutes, order, isFreePreview.
- `courseEnrollments` — courseId, courseTitle, studentId/name/email, tutorId, status (`pending` | `active` | `cancelled` | `refunded`), amountPaidUsd, commissionUsd, tutorEarningsUsd, activatedBy, paidAt, createdAt/updatedAt.
- `courseProgress` — enrollmentId, studentId, courseId, completedLessonIds[], lastLessonId, updatedAt.

Commission: platform rate stored on the course (defaulting from an admin setting doc); on activation the admin-entered amount is split into `commissionUsd` and `tutorEarningsUsd` and written onto the enrollment so historical splits stay accurate.

Security rules (appended to `FIRESTORE_SECURITY_RULES.md`):
- `courses`: public read only where `status == "published"`; tutor creates/updates own; admin full access.
- `courseLessons`: tutor and admin full access; students read only when they have an active enrollment for the course (free-preview lessons fetched via a public query filtered on `isFreePreview == true`).
- `courseEnrollments`: student reads own, tutor reads by `tutorId`, only admin may set `status` to `active` or write money fields.
- `courseProgress`: owner student read/write, tutor and admin read.
- All client queries use `where` clauses that exactly match the rules; sorting/filtering is done client-side per the existing composite-index constraint.

Media: files and cover images uploaded to a `course-media` storage bucket in Lovable Cloud (Firestore holds only URLs), keeping documents well under size limits. Videos are external links, not uploaded.

Other:
- Nav: "Courses" added to the public navbar Learn group and to student/tutor/admin dashboards (quick-link cards matching the existing group-class cards).
- Emails: reuse the existing send-email flow to notify the tutor on a new enrollment request and the student on activation.
- SEO: `/courses` and each course page get Helmet meta, canonical, and `Course` JSON-LD; both routes added to the dynamic sitemap edge function.
- i18n keys added for English, Spanish, and Arabic.

## Out of scope for this phase

Online card checkout, coupons, certificates, and course reviews. The enrollment/status/amount fields are shaped so a Stripe or Paddle checkout can later drive the same activation without reworking the UI.
