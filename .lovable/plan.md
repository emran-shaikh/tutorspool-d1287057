
# Multi-language Support (English, Arabic RTL, Spanish)

## Goal
Make TutorsPool accessible globally with a language switcher (replacing the "Global" navbar button), auto-detection on first visit, and AI-translated dynamic content (tutor bios, blog posts).

## 1. Setup — i18n framework
- Install `react-i18next`, `i18next`, `i18next-browser-languagedetector`.
- Create `src/i18n/index.ts` — initialize with EN/AR/ES, fallback EN, detector (localStorage → navigator), cache in `localStorage['tp_lang']`.
- Wrap `App.tsx` root with i18n init import.

## 2. Translation files
Create `src/i18n/locales/{en,ar,es}.json` with nested namespaces:
- `common` (buttons, actions: Sign In, Get Started, Book, Save, Cancel…)
- `nav` (Subjects, Find Tutors, Reviews, Blog, About, Contact, Become a Tutor)
- `home` (hero headline/sub, CTA, features, stats labels)
- `footer` (links, tagline, copyright)
- `auth` (login/register form labels + validation)
- `tutor` (profile page section titles: About Me, Subjects I Teach, Qualification, Book a Session…)
- `student`, `dashboard`, `misc`

Only static UI strings — no user data.

## 3. Language switcher (replaces "Global" button)
- New `src/components/LanguageSwitcher.tsx`: dropdown showing 🇺🇸 English / 🇸🇦 العربية / 🇪🇸 Español.
- On change: `i18n.changeLanguage(lang)`, persist to localStorage, set `<html lang>` and `<html dir>` (RTL for Arabic).
- Replace the `Global` button in `Navbar.tsx` (desktop + mobile).

## 4. RTL support for Arabic
- Add a small effect in `i18n/index.ts` that syncs `document.documentElement.dir` on language change.
- Tailwind: enable logical-property utilities are already fine; add a tiny `[dir="rtl"]` overrides layer in `index.css` only where visual mirroring is needed (icon spacing in Navbar, hero arrows).

## 5. Wire translations into pages
Replace hardcoded English strings with `t('key')` in high-visibility surfaces first:
- `Navbar.tsx`, `Footer.tsx`
- `pages/Index.tsx` + home components (Hero, Features, CTA, FeaturedTutors labels)
- `pages/About.tsx`, `Contact.tsx`, `FAQ.tsx`, `Subjects.tsx`, `Reviews.tsx`, `FindTutors.tsx` filters/labels
- `TutorProfilePage.tsx` section titles
- `Login.tsx`, `Register.tsx`
- Dashboard shells (StudentDashboard, TutorDashboard, ParentDashboard) — nav labels only

Leave admin pages in English (internal tool) — out of scope.

## 6. Dynamic content translation (tutor bios + blog posts)
New Edge Function `supabase/functions/translate-content/index.ts`:
- Input: `{ text: string, targetLang: 'en'|'ar'|'es', cacheKey?: string }`.
- Uses Lovable AI Gateway (`google/gemini-2.5-flash` — cheap, fast, multilingual) with a strict "translate only, preserve meaning, keep proper nouns" system prompt.
- Cache results in a new Firestore collection `translations/{sha256(cacheKey+lang)}` → `{ text, lang, createdAt }` so we translate each bio/post once per language.
- Return `{ translated }`.

Client hook `src/hooks/useTranslatedText.ts`:
- `useTranslatedText(sourceText, cacheKey)` → returns current-language text.
- If `i18n.language === 'en'` or source empty → returns source directly (no call).
- Otherwise checks a tiny in-memory + `sessionStorage` cache, else invokes the edge function.

Apply the hook to:
- `TutorProfilePage.tsx` → `bio`, `teachingStyle` (cacheKey = `tutor:{uid}:bio`, `tutor:{uid}:style`).
- `BlogPost.tsx` → `title`, `excerpt`, `content` (cacheKey = `blog:{id}:{field}`).
- `FindTutors.tsx` cards → tutor bio preview (optional; feature-flag if too many calls).

Fallback: on error, show original text silently.

## 7. Firestore rules
Add public read + server-only write for `translations` collection to `FIRESTORE_SECURITY_RULES.md` (and remind user to paste).

```
match /translations/{id} {
  allow read: if true;
  allow write: if false; // edge function via admin SDK
}
```

## 8. SEO
- Update `<html lang>` dynamically per selected language.
- Add `hreflang` alternate links to `index.html` (`en`, `ar`, `es`, `x-default`) all pointing at the same URL (SPA — same URL serves all).
- Keep canonical unchanged.

## 9. Out of scope (call out to user)
- Per-language URLs (`/es/tutors`) — would require route restructuring.
- Translating admin dashboard, emails, chatbot responses.
- Translating user-submitted reviews (kept in original language).

## Technical notes
- Bundle size: locale JSONs lazy-loaded per language.
- Cost control: dynamic translation cached in Firestore forever; only first viewer of a given bio/post in a given language triggers a Lovable AI call (~$0.0001 per 1k chars on Gemini Flash).
- No breaking changes — English users see identical experience since `t('key')` returns EN by default.

## Deliverables
- Language switcher live in navbar (desktop + mobile).
- EN/AR/ES for all public marketing pages, auth, and tutor profile chrome.
- Arabic renders RTL.
- Tutor bios and blog posts auto-translate to the selected language, cached after first translation.
- Updated Firestore rules doc.
