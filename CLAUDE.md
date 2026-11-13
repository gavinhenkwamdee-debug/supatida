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

## 11.11 campaign (`/1111`, admin at `/admin/campaign-1111`)

Config lives in `site_settings` key `campaign-1111` (no table/column, so no
prod migration to forget). Three tiers — wishlist 15% / mixmatch 11% / extra 5%.

- **MECE by construction:** `assignments` maps productId → tier, one value per
  product, and only `wishlist`/`mixmatch` are stored. Absent = `extra`, so every
  product lands in exactly one tier. Always read it through `tierOf()`.
- **Prices:** `campaignPrice()` in `lib/campaign-1111-config.ts` rounds the
  discounted price **up** to the next 100 baht, in integer math (plain
  `price * 0.85` can float to 17000.000000000002 and bump an exact price a
  full 100). Don't hand-roll the discount elsewhere. Mix & Match's pair total
  (`pairEstimate()` in `components/Campaign1111Client.tsx`) sums each item's
  own `campaignPrice()` — the same rounded number that item's own product
  card shows — rather than rounding the pair's raw subtotal once; the latter
  can save the customer a few more baht but then doesn't match what adding
  up the two cards by eye gives, which read as a pricing mistake.
- Hidden products never appear in any tier. Sold-out ones do, on the
  customer-facing page — shown with a "SOLD OUT" overlay in their normal
  price-sorted spot (not filtered out or pushed to the bottom), so customers
  see pieces sell out one by one in place. `app/1111/page.tsx` passes
  `soldOut` through on `CampaignProduct`; `ProductCard`
  (`components/Campaign1111Client.tsx`) disables the pick/LINE CTA for a
  sold-out piece, and `MixMatch`'s `toggle()` refuses to add one to the pair
  even if called directly. The campaign shows the listed `product.price` as
  the "before" price, not the fake markup from `lib/pricing.ts`. The
  *admin's* assignment tool (`Campaign1111Admin.tsx`) is the opposite —
  `eligible`/`filtered` drop sold-out pieces entirely, since once something
  sells out there's nothing left to assign. That leaves one gap: a piece
  that sold out *after* being assigned still shows "SOLD OUT" live but can no
  longer be found in that list to un-assign — `soldOutStillAssigned` is a
  separate small cleanup panel (only rendered when non-empty) that surfaces
  exactly those pieces with a one-click "เอาออก" (assign to `none`).
- **Campaign price shows on `/1111` and on a product's own detail page —
  not on the catalog grid or PayLater cards.** `app/page.tsx` (catalog grid)
  and `app/campaign/[slug]/page.tsx` (PayLater cards) always show the plain
  `product.price`, campaign on or off — browsing those shouldn't show a
  discount with no context for why. `app/products/[id]/page.tsx` (incl.
  JSON-LD/meta price) DOES call `getActiveCampaign1111()`/`productCampaign()`
  and passes the result to `ProductDetailClient`, which — when the product
  is in a real discount tier — shows `product.price` struck through, the
  "11.11 -X%" badge, the campaign price, and a "ราคานี้สำหรับแคมเปญ 11.11
  เท่านั้น" caption so it reads as a time-limited campaign price, never
  confusable with the permanent-looking markup below. Rationale: a customer
  who taps into a product straight from `/1111` must see the same price
  they just saw there, or it looks broken; a customer who finds that same
  product through the plain catalog never saw a discount promised, so no
  surprise either way. `ProductCard` and `PayLaterProductCard` still
  *accept* an optional `campaign` prop (default `null`) and know how to
  render it, just unused by their current call sites. Mix & Match has no
  single-item price (the 11% is for a pair) — the detail page's fallback
  branch (below) links out to `/1111?tab=mixmatch` instead.
- **The fallback "-25%/-30%/-35%" markup is a SEPARATE, always-on feature,
  unrelated to the 11.11 campaign.** `getOriginalPrice()`/
  `getDiscountPercent()` (`lib/pricing.ts`) invent a fake "original" price
  from `productId % 3` and show it struck through on every product that
  ISN'T in an active 11.11 discount tier — this existed before the campaign
  and runs whether or not the campaign is even enabled. `ProductDetailClient`
  picks ONE or the other per product, never both: the real 11.11 badge takes
  priority when `campaign?.kind === "discount"`, this fake markup is the
  `else` branch. Don't conflate the two when debugging a "wrong discount"
  report — check which branch actually rendered first.
- **Campaign-scoped traffic stats** (`lib/campaign-1111-tracking.ts`, table
  `campaign_1111_events`): deliberately separate from the site-wide
  `products.views`/`line_clicks` counters in `lib/db.ts` — this counts only
  `/1111` page loads and clicks into a product *from* the campaign page, so
  the admin panel's "สินค้าที่มีคนกดดูเยอะที่สุด" ranking reflects interest in
  the campaign specifically, not a product's overall traffic. Public write via
  `POST /api/campaign-1111/track` (`{type:"page_view"}` or
  `{type:"product_click",productId}`), admin-only read via
  `GET /api/admin/campaign-1111/stats`. `Campaign1111Client.tsx` fires
  `page_view` once per mount, skipped for admin preview so an admin checking
  their own campaign doesn't inflate the number they're about to read.

## Styling Lookbook (`/styling`, admin at `/admin/styling`)

A Pinterest-style masonry page of "look" photos, each tagged with 0+ real
products (by id, resolved live against `getAllProducts()` — never a
name/price snapshot, so a price change or a product going sold-out/hidden is
reflected automatically without re-editing the look). Config lives in
`site_settings` key `styling-lookbook` (`lib/styling-lookbook-config.ts`,
`normalizeStylingLookbook()` sanitizes on read/write) — no migration, same
pattern as `campaign-1111`.

- A look needs its own `image` to show publicly (`app/styling/page.tsx`
  filters out any look the admin hasn't uploaded a photo for yet, so a
  half-finished look never renders as a broken image) — it can still show
  with zero tagged products (pure inspiration, no caption list).
- Filter chips are the distinct non-empty `theme` strings across looks, free
  text the admin types per look, not a fixed enum — "ทั้งหมด" always first.
- No entry-point banner on `/1111` linking here — tried it, decided against
  it (too many photos competing with the campaign page itself). `/styling`
  is reachable directly; don't re-add that banner without being asked.
- Each item's own row shows its 11.11 price (struck-through original +
  campaign price) when it's in a real discount tier, same `productCampaign()`
  call as everywhere else — never a hand-rolled discount. The total label
  only says "(ราคา 11.11)" when at least one tagged item actually has a
  discount — otherwise it's a plain "งบรวมลุคนี้" over the regular-price sum
  in gold, not red, so the label never claims a discount that isn't there.
  A Mix & Match-tier item (`isMixMatch` on `ResolvedLookItem`) has no
  single-item campaign price (the 11% needs a pair), so it's excluded from
  that discount check and the total just uses its regular price — but it's
  NOT treated as "no promo": its row gets a small teal "Mix & Match ·
  จับคู่ลด 11%" tag, and the look gets a link to `/1111?tab=mixmatch` under
  the total whenever any item in it is mixmatch-tier, since pricing a pair
  correctly needs the real tool on `/1111`, not a guess here.
- The whole feature has its own enable/disable toggle
  (`StylingLookbookAdmin.tsx`), independent of the 11.11 campaign's own
  toggle, so the admin can stage look photos privately before switching it
  on — same reasoning as the real-photos feature on custom rings.
