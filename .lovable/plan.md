# Navbar Reorganization Plan

## Goal
Shorten the top navigation on large screens by grouping the 8 current links into categorized dropdown menus, while keeping the main category labels visible and applying the same grouping to the mobile menu.

## Proposed Grouping

| Dropdown label | Links inside | Rationale |
|---|---|---|
| **Learn** | Subjects, Find Tutors, Group Classes | Student-facing discovery |
| **Company** | Reviews, Blog, About, Contact | Trust/info pages |
| **Teach** | Become a Tutor | Tutor recruitment |

Auth, language, and currency switchers stay in the right-side action area unchanged.

## Implementation Steps

1. **Update `src/components/layout/Navbar.tsx`**
   - Replace the flat `navLinks` array with a grouped structure.
   - Build a reusable `NavDropdown` helper using existing shadcn `DropdownMenu` primitives.
   - Render top-level category triggers as buttons that open dropdowns on hover/click.
   - Preserve current active-link styling and translation keys.

2. **Mobile menu grouping**
   - Inside the hamburger panel, render each category as an expandable section (accordion or nested list) using the same grouped data.
   - Keep the existing mobile Language/Currency switchers and auth CTAs at the bottom.

3. **i18n keys**
   - Add new translation keys under `nav.categories` in `src/i18n/locales/en.json`, `es.json`, and `ar.json`:
     - `nav.categories.learn`
     - `nav.categories.company`
     - `nav.categories.teach`
   - Reuse existing link labels inside each dropdown.

4. **Accessibility**
   - Each dropdown trigger gets `aria-haspopup="true"` and `aria-expanded` state.
   - Dropdown items remain keyboard-navigable.

## Outcome
- Desktop nav collapses from 8 visible buttons to 3 category triggers + auth actions.
- Mobile menu mirrors the same categories for consistency.
- No routes or page logic change; only the navigation shell is reorganized.
