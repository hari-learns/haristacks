# haristacks

Hari writes life, tech, finance, sport and feelings.

A static blog. No CMS, no database. Every page is prerendered.

## Adding a post

Create one file. Nothing else changes.

```
content/<section>/<slug>.mdx
```

Sections are `life`, `sports`, `people` and `stories`.

```mdx
---
title: "Rational detachment"
subtitle: "Superpower that you can learn."
date: "2026-06-24"
excerpt: "One sentence for search results and link previews."
canonical: "https://haristacks.substack.com/p/rational-detachment"   # optional
---

Body in Markdown. `* * *` on its own line becomes the three-pixel break.
`> a line` becomes a pull quote.
```

Reading time is calculated. Ordering is by date, newest first. The URL is
`/<section>/<slug>`.

Adding a whole new section is one entry in `lib/categories.ts` plus a folder
under `content/`.

## The horizon

`components/PixelHorizon.tsx` draws a pixel landscape on a canvas at roughly
128 to 248 logical pixels wide, upscaled with `image-rendering: pixelated`.
It picks its palette from the visitor's local clock — dawn, day, dusk or
night — so the same page is a different page at 6am and at 9pm.

Add `?phase=dawn`, `?phase=day`, `?phase=dusk` or `?phase=night` to any URL
to preview a sky that is not the current one.

It runs at 12 frames per second, pauses off-screen and in hidden tabs, and
falls back to a single still frame when the visitor has asked for reduced
motion.

## Local

```bash
pnpm install
pnpm dev
```

## Colour

Every colour is a token in `app/globals.css`. Section accents come from
`[data-accent="..."]`, set once per page. No hex literal belongs anywhere
else.
