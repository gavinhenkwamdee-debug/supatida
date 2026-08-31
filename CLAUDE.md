# Supatida (supatidajewelry.com)

Lab-grown-diamond jewelry e-commerce site. **There is no real cart/checkout** —
every sale happens over LINE chat. Product pages, the custom ring
configurator, etc. all end in a "สอบถามข้อมูล / สั่งทำ" button that opens
the shop's LINE link, often with a summary card meant to be screenshotted
and sent to the admin.

## Stack

- Next.js 16 (App Router, Turbopack), TypeScript, React 19, Tailwind v4
- Neon Postgres via `@neondatabase/serverless`'s `neon()` tagged-template
  client — **no ORM**, hand-written SQL in `lib/*.ts`
- Images: Cloudflare R2 via `@aws-sdk/client-s3` (`lib/r2.ts`)
- Deployed on Vercel, auto-deploy from `main` (no feature-branch workflow —
  commits go straight to `main`, push only when the user asks)

## ⚠️ Local dev and production share the SAME database

`.env.local`'s Neon connection string points at the **same** Neon DB that
production uses. There is no separate local/staging database. This means:

- Any script you run against `http://localhost:3000` (or any direct SQL)
  writes to real, live, customer-facing data immediately.
- **Concurrency hazard (has actually happened, more than once):** if an
  admin has an edit page (e.g. `/admin/custom-rings/[id]/edit`) open in a
  browser tab and clicks Save *after* you've changed that same data via a
  script or another tab, their stale form data silently overwrites your
  change — including data they never touched, since these forms save the
  whole entity as one tree. **Always tell the user to refresh any open
  admin edit tab before/after you make this kind of change**, and if
  something looks wrong after a save, check whether a stale tab is the
  cause before assuming your code is broken.
- `unstable_cache`/`revalidateTag` (Next 16 requires the second arg:
  `revalidateTag(tag, { expire: 0 })`) caches are **per-deployment** —
  local dev and production have separate Data Caches. Revalidating from
  local dev does not invalidate production's cache; production
  self-corrects on its own ~60s TTL.

## Safe patterns for admin content changes

- **Never embed Thai text directly in a shell command string** — it comes
  out mojibake. Write it to a scratch file with the `Write` tool, then
  read it back in a Node script via `fs.readFileSync(path, "utf8")`
  (forward slashes in the path).
- **Don't run raw destructive SQL** (`DELETE FROM ...` etc.) against this
  DB — it tends to get blocked by the environment's safety classifier, and
  bypasses the app's own validation/side-effects anyway. Instead, call the
  real authenticated admin API from a small Node `fetch()` script:
  ```js
  const ADMIN_PASSWORD = /* read from .env.local, don't print it */;
  const cookie = `supatida_admin=${Buffer.from(ADMIN_PASSWORD).toString("base64")}`;
  await fetch("http://localhost:3000/api/admin/<route>", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(payload),
  });
  ```
  This goes through the same code path (validation, cache revalidation,
  etc.) the real admin UI uses. `lib/admin-auth.ts`'s `isAdminRequest`
  checks the `supatida_admin` cookie against
  `base64(process.env.ADMIN_PASSWORD)`.
- For a "replace the whole entity" endpoint (custom rings, etc.), fetch the
  current state first, deep-modify only what's needed in JS, and PUT the
  whole thing back — never hand-retype content you didn't author (gem
  overlay positions, swatch crops, etc. are hand-tuned by the admin via
  drag UIs and easy to lose).

## Custom Ring Configurator (`lib/customRings.ts`, `components/CustomRingConfigurator.tsx`, `components/admin/CustomRingForm.tsx`)

A ring has ordered **groups**, each with ordered **choices**. Groups have a
`kind`: `generic` (buttons/circles), `dropdown`, `text_input` (engraving),
or `main_power`/`secondary_power`/`tertiary_power` (the three "meaning"
groups — YOUR WISH / STRENGTH / BALANCE).

- **Positional meaning-matching**: for the three meaning-group kinds, a
  selected choice's gemstone "meaning" is taken from its **array index**
  within `group.choices` (0–5 map to `MEANINGS_BY_CATEGORY[category]`),
  *not* from matching its label text. This lets the admin freely rename
  choice labels without breaking the meaning-summary sentence. **Never
  reorder, insert into the middle of, or remove existing choices in these
  three groups** — only append new ones at the end (e.g. the "ไม่เลือก" /
  None choice was appended as choice #7, keeping the first 6 untouched).
  A 7th "None" choice exists in each of these groups; the customer isn't
  required to fill all three.
- **`baseImageOverride`** on a choice fully replaces the ring's base photo
  (`+ Base (แทนรูปหลัก)` in the admin form) — for genuinely different
  physical ring products/designs. **`colorFilter`** on a choice is a CSS
  `filter()` string layered on top of whichever base photo is showing —
  for metal-color tinting (e.g. sepia+hue-rotate to push a neutral
  white-gold photo toward yellow/rose/vanilla gold) without needing a
  separate real photo per color.
- Resolution when multiple selected choices set `baseImageOverride`:
  `CustomRingConfigurator.tsx`'s `effectiveBaseImage` picks the **last
  group (in `groups` array order) that has one selected** — not
  first-wins. **Only one group in a given ring should ever use
  `baseImageOverride`** (currently: "Base Ring"), or a later group will
  silently shadow an earlier group's photo choice for every combination.
  Keep other metal/material axes on `colorFilter` or plain price deltas
  instead of photo swaps, unless you also change this resolution logic.
- A `generic`-kind group renders as swatch **circles** only if *every*
  choice in it has a `swatchImage` set; otherwise the whole group falls
  back to rectangular text buttons. `swatchImage` can be a real uploaded
  photo/gradient PNG, or a `data:image/svg+xml,...` URI generated inline
  (no upload needed) — used for the gradient-sphere color swatches and the
  dashed-circle "None" placeholder.
