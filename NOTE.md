# Skillpath — WebVeda submission

## Published Framer site
https://intelligent-operation-588996.framer.app/

## Code
https://github.com/harsh-791/webVeda/blob/main/framer/CoursesSection.tsx

## Note (≤200 words)

I built Skillpath’s courses block as a Framer code component that GETs course data and country code in parallel with `Promise.allSettled`. Loading uses skeletons; failures show a message and retry; an empty array gets its own state. Prices convert paise/cents with `/100` and `Intl`. If courses load but country fails, I still render cards, fall back to INR, and show a banner — silent wrong currency felt worse than an honest default.

Each card shows name, two-line description, price, category, and a refundable badge when true. The grid is 1/2/3 columns via container queries so it follows the Framer frame. Property controls: section title and accent color.

With two more days I’d add clearer design tokens, session-cache a successful country code, and validate each course field more strictly. I got stuck briefly on Framer width vs viewport breakpoints; container queries fixed it. I’m least happy with the INR fallback choice — it’s a judgment call.

## AI used
Cursor (Grok). It drafted the first fetch/UI pass; I reworked error/currency handling, controls, and responsive layout.

Shared chat link: [paste shared Cursor conversation URL here]
