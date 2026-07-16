# Tutor Profile Detail Page

Replace the "View Profile" popup on `FindTutors` with a real routed page styled like the attached reference design, using only fields we already have in Firestore. Sections with no available data are omitted (no invented values).

## New page

Create `src/pages/TutorProfilePage.tsx` at route `/tutors/:uid` (public), registered in `src/App.tsx`.

Data source: `getTutorProfile(uid)` + `getAllReviews()` filtered by `tutorId` (same pattern as `FindTutors`).

## Layout (mirrors the reference)

Two-column layout on desktop, single column on mobile.

**Top hero banner** (soft orange gradient, matches design):
- Back to Tutors link (→ `/find-tutors`)
- Large circular avatar (`photoURL` or initials fallback) with online dot only if we track presence — we don't, so omit dot
- Name + verified check (show check only if `isApproved`)
- `degreeLevel` line with grad cap icon (only if present)
- "New Tutor" pill if `reviewCount === 0`
- Member since `createdAt` (formatted "Month YYYY")
- Three stat cards: Students, Sessions, Rating — we only have Rating (`avgRating` + `reviewCount`). Students/Sessions are NOT in our data, so we render just the Rating stat card (single card, or a compact row) — no fabricated numbers.
- Right-side sticky booking card: `$hourlyRate/hr`, "Session Rate", **Book a Session** button (routes to `/student/book/:uid` for students, `/login` otherwise — same `BookButton` logic as FindTutors). Omit "Send Message" and "Save Tutor" (no backing feature).

**Left column:**
- **About Me** — `bio` (only if present)
- **Subjects I Teach** — badges from `subjects[]`
- **Qualification** — `qualifications` (only if present)
- **Teaching Experience** — `experience` (only if present)
- **Teaching Style** — `teachingStyle` (only if present)

**Right column:**
- **Student Reviews** — list from reviews filtered by `tutorId`; show avg rating, count, and each review's rating + text + reviewer name (fields already used elsewhere). Hidden entirely if no reviews.
- **Report Tutor** — omit (no backing feature).

Availability, Speaks, Gender, Timezone, Achievements, "Ready to achieve..." CTA card — all omitted because we have no data for them.

## Wire up entry point

In `src/pages/FindTutors.tsx`:
- Remove the `<Dialog>` block wrapping the "View Profile" button
- Replace with `<Link to={`/tutors/${tutor.uid}`}>` wrapping the same styled "View Profile" button
- Drop unused `Dialog*` imports and `selectedTutor` state

## Styling

Use existing design tokens (primary orange, card, muted) and shadcn components (`Card`, `Badge`, `Button`, `Avatar`). Soft orange gradient hero via `bg-gradient-to-br from-primary/10 via-orange-100/40 to-transparent` to match the reference's warm banner. Sticky booking card on `lg:` with `lg:sticky lg:top-24`.

## Files

- Create: `src/pages/TutorProfilePage.tsx`
- Edit: `src/App.tsx` (add route)
- Edit: `src/pages/FindTutors.tsx` (dialog → link)

No backend, no schema, no new fields.
