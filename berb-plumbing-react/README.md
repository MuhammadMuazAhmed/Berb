# BERB Plumbing – React Redesign

A React + TypeScript recreation and UI/UX improvement of the **BERB** plumbing, heating and solar
company website (Cologne, Germany), built as an internship project.

Reference design: https://berb-plumbing-90dc74f8439a40610e22cfe8a.webflow.io/
(a Webflow template by Marc Heine).

## Project overview

**Preserved from the reference**

- Section order: header, hero, statistics, company introduction, services, references, emergency call-out, contact, footer.
- Brand palette, the three colours published on the template's style guide page: `#161723` (dark blue), `#c6c6c7` (grey) and white.
- Typography: **STIX Two Text** (headings, uppercase hero) and **Ubuntu** (body), the two Google Fonts named on the template's licensing page.
- Copy and facts: "Your plumbing specialist in Cologne", founded 2020, 5 team members, 500+ projects, 100% happy clients, address, email and phone number.
- Decorative circle motif (about section graphic, emergency section).
- Language: English, consistently.

**UI/UX improvements**

- Three clearly differentiated service cards. The original repeated the same paragraph three times; each card now has its own image, description and highlights, equal heights and a CTA that pre-selects the service in the contact form.
- Statistics laid out as an aligned, divided row (2×2 on mobile) with a short count-up animation.
- About section turned from a mostly empty area into a balanced text + ring-graphic layout.
- References gallery with an accessible lightbox (close button, Esc, arrow keys, focus trap, focus return).
- New "How we work" process section.
- The original testimonials were repeated lorem-ipsum quotes with made-up names. They are **not** reproduced as real reviews; a "What you can expect" section built only from claims on the original site replaces them.
- Real working contact form with validation and accessible errors; sticky header; working mobile menu; skip link; reduced-motion support.

**Stack:** React 18, TypeScript, Vite 5, `motion` (Framer Motion) for animation, Lucide icons, plain CSS with design tokens.

## Requirements

- Node.js 18 or newer (developed on Node 22)
- npm 9 or newer

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Vite prints a local URL, normally `http://localhost:5173/`.

## Production build

```bash
npm run build
```

Output goes to the `dist/` folder.

## Preview the production build

```bash
npm run preview
```

## Project structure

```
src/
  main.tsx              entry point, loads fonts + styles
  App.tsx               page composition
  components/           one component per section (Header, Hero, StatsSection, ...)
                        plus Reveal (scroll animation), Lightbox, Logo, SectionHeading
  data/                 company.ts (contact info, nav, stats), services.ts, projects.ts
  assets/               downloaded photographs & SVG graphics from Webflow
  styles/tokens.css     design tokens (colours, fonts, spacing, motion)
  styles/globals.css    all component styles
public/berb-favicon.jpg, public/berb-webclip.jpg
```

## Asset information

- Images live in `src/assets/` and are imported directly into components and data files, so Vite bundles and optimizes them.
- All photography and graphics (hero photo, service cards, references gallery, circle motif, CTA photo) were downloaded from the reference website https://berb-plumbing-90dc74f8439a40610e22cfe8a.webflow.io/.
- Fonts come from the npm packages `@fontsource/stix-two-text` and `@fontsource/ubuntu` (SIL Open Font License) and are bundled locally at build time. No Google Fonts requests are made at runtime.
- Icons come from `lucide-react`.
- See **`ASSET_MANIFEST.md`** for the full list of downloaded assets and their roles.

## Functionality and limitations

Working: header navigation and smooth scrolling (offset for the sticky header), mobile menu (button, Esc, closes on link click), hero/service/gallery CTAs, `tel:` and `mailto:` links, count-up statistics, scroll reveals, gallery lightbox, contact form validation.

Limitations:

- **The contact form is frontend-only.** There is no backend, so nothing is delivered to the company. After valid submission the UI says so clearly and offers an "Open in my email app" `mailto:` link containing the entered message. To receive real submissions, connect a form service (Formspree, Netlify Forms, etc.) or your own API in `ContactSection.tsx`.
- The original has separate sub-pages (sanitary, heating, solar, references, contact, team). This version is a single page; service "Learn more" links lead to the contact form with the service pre-selected.
- The original's team section (placeholder names, one repeated photo) is not recreated, to avoid presenting made-up people.
- The reference mentions a 24h emergency number. This demo uses neutral wording and does not promise round-the-clock availability.
- The exact layout, spacing and animation settings of the original could not be inspected pixel-by-pixel, so these are approximations; the colours and fonts come from the template's own style-guide and licensing pages.

## Customization

| What | Where |
| --- | --- |
| Colours, fonts, spacing, motion timing | `src/styles/tokens.css` |
| Contact details, navigation, statistics | `src/data/company.ts` |
| Services (text, images, highlights) | `src/data/services.ts` |
| Gallery projects | `src/data/projects.ts` |
| Images | `src/assets/images/` |
| Animation variants | `Reveal.tsx` (scroll), `Hero.tsx` (page load), `StatsSection.tsx` (count-up) |
| Page title / meta description | `index.html` |

## Deployment

The output of `npm run build` is a static site. On Vercel or Netlify, import the repository, use the
build command `npm run build` and the output directory `dist`.
