# Skillpath — Framer junior assignment

Landing page for a fake learning platform. The scored piece is a **Framer code component** that loads courses from a flaky API and prices them by region.

## Repo contents

| Path | What it is |
| --- | --- |
| `framer/CoursesSection.tsx` | Paste this into Framer as a code component |
| `NOTE.md` | Draft of the ≤200 word note for the form |
| `README.md` | This file |

Hero + footer are built in the Framer UI (not in code). Only the courses section is a code component, as required.

## Framer setup

1. Create a free Framer site named **Skillpath**.
2. Build a simple page:
   - **Hero**: brand name, headline, one supporting line, one CTA button.
   - **Courses**: leave space for the code component.
   - **Footer**: three links + copyright.
3. Open **Assets → Code → New Component**.
4. Paste everything from `framer/CoursesSection.tsx`.
5. Save, then drag **CoursesSection** onto the page between hero and footer.
6. Stretch it to full content width. In the right panel you should see:
   - **Title** — section heading
   - **Accent** — category chip / button color
7. Publish and copy the public URL.

### Suggested page copy (optional)

- Brand: Skillpath
- Headline: Learn the skills that actually ship
- Sub: Short, practical courses for creators and freelancers.
- CTA: Browse courses
- Footer links: About · Courses · Contact
- Copyright: © 2026 Skillpath

## API

Base: `https://syncsphere-hiv6.onrender.com`

| Endpoint | Method | Notes |
| --- | --- | --- |
| `/assignment/course-data` | GET | 5–10 courses; count varies; ~1/3 fail with 404/500 |
| `/assignment/country-code` | GET | `{ "country_code": "IN" \| "US" }`; also flaky |

### Price math (do not get this wrong)

- **IN** → `pricePaise / 100` → format as INR  
  Example: `199900` paise → **₹1,999** (not ₹1,99,900)
- **US** → `priceUsdCents / 100` → format as USD  
  Example: `3999` cents → **$39.99**

## Behaviour decisions

### Four UI states

1. **Loading** — skeleton cards (not a spinner)
2. **Error** — message + **Try again** (courses request failed)
3. **Empty** — API returned `[]`
4. **Ready** — responsive grid of cards

### Country fails, courses succeed

Still show the grid. Fall back to **INR** and show a short banner:

> We couldn't detect your region, so prices are shown in INR.

Wrong answers would be: blank page, raw error, or silently showing USD/INR as if detection worked.

### Extra field on each card

**`mainCategory`** — what a learner uses to scan relevance.

### Property controls (designer-facing)

1. **Title** — section heading
2. **Accent** — category chip + primary button color

### Extras included

- Search filter
- Sort by price (asc/desc)
- Skeleton loaders
- Retry button
- Refundable badge when `refundable === true`
- Responsive grid: 1 → 2 → 3 columns (container queries, so Framer frame width matters)

## How to explain on the call

Be ready to walk through:

- `Promise.allSettled` so one failing endpoint doesn’t kill the other
- Why currency fallback is explicit, not silent
- `pricePaise / 100` and `priceUsdCents / 100`
- `-webkit-line-clamp: 2` for description truncation
- Why controls are Title + Accent

## Submit checklist

- [ ] Framer site published, link opens
- [ ] Code on GitHub (public repo) or Gist
- [ ] Note ≤ 200 words (`NOTE.md`)
- [ ] Disclose AI use + **share this Cursor chat link**
- [ ] You can explain every line

### Sharing this Cursor chat

In Cursor: open the chat menu → **Share** / copy conversation link (wording varies by Cursor version). Paste that URL on the form. Do not paste a summary — they want the real thread.
