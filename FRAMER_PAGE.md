# Skillpath — page build checklist (Framer UI)

Use this while assembling the page around the code component.

## Canvas structure

1. Desktop breakpoint first, then check tablet/phone.
2. Stack vertically: **Hero → CoursesSection → Footer**.
3. Give CoursesSection full content width (roughly 1200px max content, stretched).

## Hero (design freely)

Minimum required:

- Headline
- One supporting line
- One button

Suggested:

- Eyebrow / brand: **Skillpath** (make the brand obvious in the first viewport)
- Headline: Learn the skills that actually ship
- Line: Short, practical courses for creators and freelancers
- Button: Browse courses (link/scroll to courses section)

Keep the first viewport simple: brand, headline, line, CTA. No stats strip.

## Courses

- Insert the **CoursesSection** code component.
- Set **Title** and **Accent** from the properties panel.
- Preview several refreshes — the API fails on purpose ~1/3 of the time.

## Footer

- Three text links (e.g. About, Courses, Contact)
- Copyright line: © 2026 Skillpath

## Publish

Site → Publish → copy the `framer.website` (or custom) URL for the form.
