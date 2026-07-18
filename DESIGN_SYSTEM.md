# BackOffice Pro — Design System

> **The authoritative source for all visual language, component standards, and interaction patterns.**

---

## 1. Design Philosophy

Blend the design sensibility of **Apple**, **Linear**, **Stripe**, **Arc Browser**, **Nothing**, **OpenAI**, and **Framer** into a unique BackOffice Pro identity.

Core principles:
- **Minimal** — Remove until broken. Every element earns its place.
- **Clean** — Crisp edges, generous whitespace, breathing room.
- **Elegant** — Refined typography, subtle depth, restrained colour.
- **Enterprise** — Trustworthy, professional, ready for procurement teams.
- **Alive** — Fluid transitions, organic motion, no hard cuts.

---

## 2. Colour System

### 2.1 Primary Palette

| Token | Role | Value |
|-------|------|-------|
| `pure-white` | Primary background | `#FFFFFF` |
| `soft-white` | Secondary background | `#FAFBFC` |
| `ghost-white` | Tertiary background | `#F5F7FA` |
| `royal-blue` | Primary accent | `#2563EB` |
| `electric-blue` | Interactive accent | `#0066FF` |
| `blue-50` | Blue tint | `#EFF6FF` |
| `blue-100` | Blue surface | `#DBEAFE` |
| `charcoal` | Primary text | `#1E293B` |
| `slate` | Secondary text | `#475569` |
| `muted-grey` | Tertiary text | `#94A3B8` |
| `soft-grey` | Borders, dividers | `#E2E8F0` |
| `whisper-grey` | Hover backgrounds | `#F1F5F9` |

### 2.2 Extended Palette

| Token | Usage | Value |
|-------|-------|-------|
| `success` | Positive states | `#10B981` |
| `warning` | Caution states | `#F59E0B` |
| `destructive` | Error / danger | `#EF4444` |

### 2.3 Glassmorphism Palette

| Token | Usage | Value |
|-------|-------|-------|
| `glass-bg` | Glass card background | `rgba(255,255,255,0.72)` |
| `glass-border` | Glass card border | `rgba(255,255,255,0.5)` |
| `glass-shadow` | Glass card shadow | `0 8px 32px rgba(31,38,135,0.07)` |
| `glass-blur` | Backdrop filter | `blur(20px)` |

---

## 3. Typography

### 3.1 Font Stack

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

Monospace:
```css
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### 3.2 Type Scale

| Name | Size | Weight | Line Height | Tracking | Usage |
|------|------|--------|-------------|----------|-------|
| `display` | 3.5rem (56px) | 800 | 1.1 | -0.025em | Hero headlines |
| `h1` | 2.25rem (36px) | 700 | 1.2 | -0.02em | Section headings |
| `h2` | 1.875rem (30px) | 700 | 1.3 | -0.015em | Sub-section headings |
| `h3` | 1.5rem (24px) | 600 | 1.35 | -0.01em | Card headings |
| `h4` | 1.125rem (18px) | 600 | 1.4 | 0 | Sub-headings |
| `body-lg` | 1.125rem (18px) | 400 | 1.7 | 0 | Lead paragraphs |
| `body` | 1rem (16px) | 400 | 1.6 | 0 | Default body text |
| `body-sm` | 0.875rem (14px) | 400 | 1.5 | 0 | Secondary text |
| `caption` | 0.75rem (12px) | 500 | 1.4 | 0.01em | Labels, captions |
| `overline` | 0.6875rem (11px) | 600 | 1.3 | 0.08em | Overline labels (uppercase) |

### 3.3 Colour by Role

| Role | Light Mode | Usage |
|------|-----------|-------|
| `text-primary` | `charcoal` (#1E293B) | Headings, body |
| `text-secondary` | `slate` (#475569) | Descriptions |
| `text-tertiary` | `muted-grey` (#94A3B8) | Captions, hints |
| `text-accent` | `electric-blue` (#0066FF) | Links, interactive |
| `text-inverse` | `pure-white` (#FFFFFF) | On-colour text |

---

## 4. Spacing Scale

Based on 4px grid:

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0 | — |
| `space-0.5` | 2px | Tight micro-padding |
| `space-1` | 4px | Icon gaps, inline spacing |
| `space-1.5` | 6px | Compact element spacing |
| `space-2` | 8px | Small gaps, form element padding |
| `space-3` | 12px | Card padding (compact) |
| `space-4` | 16px | Standard card padding, stack gaps |
| `space-5` | 20px | Section internal spacing |
| `space-6` | 24px | Card padding (standard), stack spacing |
| `space-8` | 32px | Section gaps |
| `space-10` | 40px | Large section gaps |
| `space-12` | 48px | Section vertical padding |
| `space-16` | 64px | Major section spacing |
| `space-20` | 80px | Page-level section spacing |
| `space-24` | 96px | Hero section spacing |

---

## 5. Elevation System

| Level | Usage | CSS |
|-------|-------|-----|
| 0 | Flat surfaces | none |
| 1 | Cards, inputs at rest | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)` |
| 2 | Cards on hover, dropdowns | `0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.06)` |
| 3 | Modals, popovers | `0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.04)` |
| 4 | Floating nav, toast | `0 20px 25px rgba(0,0,0,0.06), 0 8px 10px rgba(0,0,0,0.04)` |
| 5 | Command palette, lightbox | `0 25px 50px rgba(0,0,0,0.12)` |

---

## 6. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 6px | Badges, tags, small buttons |
| `radius-md` | 8px | Inputs, buttons (default) |
| `radius-lg` | 12px | Cards, dialogs |
| `radius-xl` | 16px | Large cards, hero containers |
| `radius-2xl` | 24px | Pill buttons, floating elements |
| `radius-full` | 9999px | Avatars, pills |

---

## 7. Glassmorphism Rules

### 7.1 Glass Card

```css
.glass {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07);
}
```

### 7.2 Glass Navigation

```css
.glass-nav {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.5);
}
```

### 7.3 Glass Input

```css
.glass-input {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 8px;
}
```

### 7.4 Usage Rules

- Glass effects only on light backgrounds
- Never glass-on-glass (avoid stacking blur)
- Minimum border opacity: 0.3
- Minimum background opacity: 0.5
- Use on: Navigation, cards, modals, floating panels
- Do NOT use on: Buttons, inputs (unless specifically designed), tables

---

## 8. Liquid Morphism Transitions

### 8.1 Shape Interpolation

```css
/* Card morphing */
.card-morph {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-morph:hover {
  border-radius: 16px;
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 102, 255, 0.08);
}
```

### 8.2 Fluid Navigation

```css
/* Nav item active indicator morphing */
.nav-indicator {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 8.3 Button Ripple

- Buttons ripple from click point using Framer Motion
- Background expands organically, not linearly
- Spring physics: stiffness 300, damping 30

### 8.4 Dialog Morph

- Dialogs appear to morph from the trigger element
- Use Framer Motion `layoutId` for shared element transitions
- Background dims with `backdrop-blur-sm`

### 8.5 Page Transitions

- No hard cuts between pages
- Use `AnimatePresence` for route transitions
- Content fades and slides in from below (y: 20 → 0)
- Duration: 0.3s, ease: cubic-bezier(0.4, 0, 0.2, 1)

---

## 9. Motion System

### 9.1 Principles

- **Purposeful** — Every animation communicates something
- **Quick** — 150ms–400ms for UI feedback, 300ms–500ms for page transitions
- **Spring-based** — Prefer spring physics over linear easing
- **Respectful** — Reduce motion for users with `prefers-reduced-motion`

### 9.2 Framer Motion Presets

```typescript
// Fade up (content entrance)
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
};

// Fade in (simple appearance)
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 }
};

// Scale in (dialogs, modals)
const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
};

// Stagger children
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } }
};

// Spring hover
const springHover = {
  whileHover: { scale: 1.02, y: -2 },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 400, damping: 17 }
};
```

### 9.3 Micro-Interactions

| Element | Interaction | Animation |
|---------|-------------|-----------|
| Button | Hover | `scale(1.02)`, shadow deepen, 200ms |
| Button | Press | `scale(0.98)`, 100ms |
| Card | Hover | `translateY(-2px)`, shadow elevate, 300ms |
| Link | Hover | Underline slides in from left, 200ms |
| Input | Focus | Ring appears, border colour shift, 150ms |
| Badge | Appear | Scale from 0.8 → 1, opacity 0 → 1, 200ms |
| Toggle | Switch | Thumb slides with spring physics, 200ms |
| Toast | Enter | Slide up + fade, 300ms spring |
| Toast | Exit | Slide right + fade, 200ms |

### 9.4 Scroll Reveal

- Elements reveal on scroll using `IntersectionObserver`
- Default: fade up (y: 30 → 0, opacity 0 → 1)
- Stagger: 80ms between siblings
- Trigger threshold: 20% visible

---

## 10. Component Variants

### 10.1 Buttons

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| `primary` | `electric-blue` | White | none | darken 10%, shadow grow |
| `secondary` | `ghost-white` | `charcoal` | `soft-grey` | background lighten |
| `outline` | transparent | `charcoal` | `soft-grey` | `whisper-grey` bg |
| `ghost` | transparent | `slate` | none | `whisper-grey` bg |
| `destructive` | `destructive` | White | none | darken 10% |
| `link` | transparent | `electric-blue` | none | underline |

Sizes: `sm` (32px), `md` (40px), `lg` (48px), `xl` (56px)

All buttons:
- Border radius: `radius-md` (8px) for sm/md, `radius-lg` (12px) for lg/xl
- Font weight: 500
- Transition: 200ms ease
- Focus ring: 2px solid `electric-blue` with 2px offset

### 10.2 Inputs

| State | Border | Background | Ring |
|-------|--------|-----------|------|
| Default | `soft-grey` | `pure-white` | none |
| Focus | `electric-blue` | `pure-white` | `electric-blue/20` |
| Error | `destructive` | `pure-white` | `destructive/20` |
| Disabled | `soft-grey` | `ghost-white` | none |

- Height: 40px (md), 48px (lg)
- Border radius: `radius-md`
- Padding: 12px horizontal
- Placeholder: `muted-grey`

### 10.3 Cards

| Variant | Background | Border | Shadow | Radius |
|---------|-----------|--------|--------|--------|
| `default` | `pure-white` | `soft-grey` | Level 1 | `radius-lg` |
| `glass` | `glass-bg` | `glass-border` | `glass-shadow` | `radius-lg` |
| `elevated` | `pure-white` | none | Level 3 | `radius-lg` |
| `interactive` | `pure-white` | `soft-grey` | Level 1 → 2 on hover | `radius-lg` |

### 10.4 Badges

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| `default` | `ghost-white` | `slate` | none |
| `blue` | `blue-50` | `royal-blue` | none |
| `success` | `emerald-50` | `emerald-600` | none |
| `warning` | `amber-50` | `amber-600` | none |
| `destructive` | `red-50` | `red-600` | none |

### 10.5 Tables

- Header: `ghost-white` background, `caption` typography, uppercase
- Rows: `pure-white` background, `soft-grey` bottom border
- Row hover: `whisper-grey` background
- Cell padding: 12px vertical, 16px horizontal
- Font: `body-sm`

---

## 11. Iconography

### 11.1 Icon Set

- Primary: **Lucide React** (lucide-react)
- Size consistency:
  - Inline: 16×16
  - Button icons: 18×18 or 20×20
  - Navigation icons: 20×20
  - Feature icons: 24×24
  - Hero icons: 32×32 or 48×48

### 11.2 Icon Colour

- Default: inherit text colour
- Accent: `electric-blue`
- Positive: `success`
- Negative: `destructive`
- Muted: `muted-grey`

---

## 12. Layout

### 12.1 Grid

- Max content width: 1280px (7xl)
- Gutters: 24px (mobile) → 32px (desktop)
- Column count: 4 (mobile), 6 (tablet), 12 (desktop)

### 12.2 Section Spacing

- Between sections: 96px (py-24)
- Within sections: 64px (gap-16)
- Card grid gaps: 24px (gap-6)

### 12.3 Responsive Breakpoints

| Name | Min Width | Columns | Gutters |
|------|-----------|---------|---------|
| `sm` | 640px | 4 | 16px |
| `md` | 768px | 6 | 24px |
| `lg` | 1024px | 8 | 32px |
| `xl` | 1280px | 12 | 32px |
| `2xl` | 1536px | 12 | 32px |

---

## 13. Accessibility Standards (WCAG 2.2 AA)

### 13.1 Colour Contrast

- Normal text: minimum 4.5:1 ratio
- Large text (≥18px bold or ≥24px): minimum 3:1 ratio
- Interactive elements: minimum 3:1 against adjacent colours

### 13.2 Focus Management

- Visible focus ring on all interactive elements
- Focus ring: 2px solid `electric-blue`, 2px offset
- Skip-to-content link as first focusable element
- Logical tab order matching visual layout

### 13.3 Keyboard Navigation

- All interactive elements reachable via Tab
- Escape closes modals, dropdowns, command palette
- Arrow keys navigate within groups (tabs, dropdowns, menus)
- Enter/Space activates buttons and links

### 13.4 ARIA

- Semantic HTML elements preferred over ARIA roles
- All images have descriptive `alt` text
- Form fields have associated labels
- Dynamic content uses `aria-live` regions
- Icons without text have `aria-label`

### 13.5 Motion

- Respect `prefers-reduced-motion: reduce`
- All animations have `duration: 0` fallback
- No content flashes more than 3 times per second

### 13.6 Screen Reader

- Heading hierarchy: h1 → h2 → h3 (no skipping)
- Landmark regions: `header`, `nav`, `main`, `footer`
- Decorative icons: `aria-hidden="true"`
- Complex widgets use appropriate ARIA patterns

---

## 14. Dark Mode (Future)

Dark mode is not part of the LC release. If implemented later:

- Use `class="dark"` strategy on `<html>`
- All tokens remap via CSS variables
- Glassmorphism adapts to dark backgrounds
- Shadows become more prominent in dark mode

---

## 15. Naming Conventions

### 15.1 Files

- Components: `PascalCase.tsx` (e.g., `HeroSection.tsx`)
- Utilities: `kebab-case.ts` (e.g., `api-client.ts`)
- Styles: `kebab-case.css` (e.g., `globals.css`)
- Pages: `page.tsx` (Next.js convention)
- Layouts: `layout.tsx` (Next.js convention)

### 15.2 CSS Classes

- Follow Tailwind utility naming
- Custom classes: `kebab-case` (e.g., `glass`, `text-gradient`)
- BEM not used; Tailwind utilities preferred

### 15.3 TypeScript

- Interfaces preferred over types for props
- Props interface: `ComponentNameProps`
- Default exports for pages and layouts
- Named exports for components

---

*Last updated: 2026-07-17*
*This document is the authoritative source for all BackOffice Pro UI development.*
