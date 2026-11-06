import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// "Power" groups drive the special ring-stone selection UI: main_power lets the
// customer pick diamond (any shape) or gemstone (round only), secondary_power is
// always a small round stone, tertiary_power is always a square gemstone.
// "dropdown" renders its choices as a <select> (e.g. ring size) instead of buttons.
// "text_input" has no choices — the customer types free text (e.g. engraving) and
// `placeholder`/`priceDelta` on the group configure it.
// "metal" marks the group holding the ring's metal/karat choices (Silver,
// 9K, 14K, 18K, ...) — each choice's sizeSurchargePerStep lets the ring-size
// dropdown's price scale with the selected metal (see sizeSurchargePerStep
// below) instead of every size needing its own hand-set priceDelta.
export type GroupKind = "generic" | "dropdown" | "text_input" | "main_power" | "secondary_power" | "tertiary_power" | "metal";
export type StoneKind = "diamond" | "gem";
export { DIAMOND_SHAPES } from "./ringShapes";
export type { DiamondShape } from "./ringShapes";

export interface DiamondShapeOverlay {
  x: number;
  y: number;
  width: number;
  rotation: number;
}

export interface CustomRingChoice {
  id: number;
  label: string;
  swatchImage: string;
  // Many source photos have the gem centered in a mostly-empty frame — this
  // zooms just the on-site swatch/overlay display (never the stored file)
  // so it fills its circle. 1 = no zoom, admin-tunable per choice.
  swatchZoom: number;
  // Pan offset (% of the swatch's own rendered size) so an off-center gem
  // can be centered after zooming in — 0,0 is untouched/original position.
  swatchOffsetX: number;
  swatchOffsetY: number;
  // Straightens a crooked source photo — degrees, 0 = untouched.
  swatchRotation: number;
  // CSS filter() string (e.g. "sepia(.5) saturate(2) hue-rotate(-10deg)")
  // applied to the ring's base photo when this choice is selected — a metal
  // color tint layered on top of one neutral photo instead of swapping to a
  // separate photo per color. Null/empty = no tint. Only ever set on
  // "color" choices; unrelated to baseImageOverride, which fully replaces
  // the photo (e.g. for a different ring design).
  colorFilter: string | null;
  overlayImage: string | null;
  overlayX: number;
  overlayY: number;
  overlayWidth: number;
  overlayRotation: number;
  // Only meaningful on the ACHIEVEMENT ("ความสำเร็จ") choice, whose gemstone
  // is Diamond — the customer there also picks a diamond shape, and each
  // shape's photo has a different natural silhouette/aspect ratio, so the
  // overlayX/Y/Width/Rotation above (the default) can look off for some
  // shapes. Keyed by shape (e.g. "round", "marquise"); a shape with no entry
  // here falls back to the default overlay fields above.
  diamondShapeOverlays: Record<string, DiamondShapeOverlay>;
  baseImageOverride: string | null;
  // baseImageOverride photos come from separate shoots and often frame the
  // ring at a different size/position within the square — these nudge the
  // photo (translate %/scale) at display time so switching between
  // baseImageOverride choices doesn't visibly shift the ring, keeping any
  // gem overlays aligned. 1/0/0 = untouched. Unrelated to swatchZoom/Offset,
  // which only affects the small option swatch, not the big product photo.
  baseImageZoom: number;
  baseImageOffsetX: number;
  baseImageOffsetY: number;
  priceDelta: number;
  // Only meaningful on a choice inside a "metal" group — baht added per ring
  // size from size 56 upward (size 56 itself = 1 step) when this metal is
  // selected together with a numeric-labeled choice in any "dropdown" group.
  // 0 for metals with flat sizing (e.g. Silver).
  sizeSurchargePerStep: number;
  // Only meaningful on a choice inside a "metal" group — true for a base
  // metal that can't reliably hold other color plating (e.g. Silver, where
  // rose/yellow gold plating wears off quickly). When this metal is
  // selected, every OTHER group that has at least one choice flagged
  // isWhiteGoldOption (below) is narrowed down to just that choice.
  onlyWhiteGold: boolean;
  // Admin-flagged on whichever choice represents the neutral/White Gold
  // option in a "ring color"-style group — set directly rather than
  // inferred from colorFilter === "none", since a color group may tint via
  // colorFilter OR swap in a whole different baseImageOverride photo per
  // color, and onlyWhiteGold (above) needs to work either way. At most one
  // choice per group should have this set.
  isWhiteGoldOption: boolean;
  sortOrder: number;
  stoneKind: StoneKind | null;
  shape: string | null;
}

export interface CustomRingGroup {
  id: number;
  label: string;
  sortOrder: number;
  kind: GroupKind;
  placeholder: string;
  priceDelta: number;
  choices: CustomRingChoice[];
}

export interface CustomRing {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  baseImage: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomRingDetail extends CustomRing {
  groups: CustomRingGroup[];
}

export interface ChoiceInput {
  label: string;
  swatchImage: string;
  swatchZoom: number;
  swatchOffsetX: number;
  swatchOffsetY: number;
  swatchRotation: number;
  colorFilter: string | null;
  overlayImage: string | null;
  overlayX: number;
  overlayY: number;
  overlayWidth: number;
  overlayRotation: number;
  diamondShapeOverlays: Record<string, DiamondShapeOverlay>;
  baseImageOverride: string | null;
  baseImageZoom: number;
  baseImageOffsetX: number;
  baseImageOffsetY: number;
  priceDelta: number;
  sizeSurchargePerStep: number;
  onlyWhiteGold: boolean;
  isWhiteGoldOption: boolean;
  sortOrder: number;
  stoneKind: StoneKind | null;
  shape: string | null;
}

export interface GroupInput {
  label: string;
  sortOrder: number;
  kind: GroupKind;
  placeholder: string;
  priceDelta: number;
  choices: ChoiceInput[];
}

export interface RingFieldsInput {
  name: string;
  description: string;
  basePrice: number;
  baseImage: string;
  enabled: boolean;
}

// ── Schema init ───────────────────────────────────────────
export async function initCustomRingsDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS custom_rings (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      base_price  NUMERIC NOT NULL DEFAULT 0,
      base_image  TEXT NOT NULL DEFAULT '',
      enabled     BOOLEAN NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS custom_ring_groups (
      id         SERIAL PRIMARY KEY,
      ring_id    INT NOT NULL REFERENCES custom_rings(id) ON DELETE CASCADE,
      label      TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS custom_ring_choices (
      id                  SERIAL PRIMARY KEY,
      group_id            INT NOT NULL REFERENCES custom_ring_groups(id) ON DELETE CASCADE,
      label               TEXT NOT NULL,
      swatch_image        TEXT NOT NULL DEFAULT '',
      overlay_image       TEXT,
      overlay_x           NUMERIC NOT NULL DEFAULT 50,
      overlay_y           NUMERIC NOT NULL DEFAULT 50,
      overlay_width       NUMERIC NOT NULL DEFAULT 20,
      base_image_override TEXT,
      price_delta         NUMERIC NOT NULL DEFAULT 0,
      sort_order          INT NOT NULL DEFAULT 0
    )
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS base_image_override TEXT
  `;
  await sql`
    ALTER TABLE custom_ring_groups ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'generic'
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS stone_kind TEXT
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS shape TEXT
  `;
  await sql`
    ALTER TABLE custom_ring_groups ADD COLUMN IF NOT EXISTS placeholder TEXT NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE custom_ring_groups ADD COLUMN IF NOT EXISTS price_delta NUMERIC NOT NULL DEFAULT 0
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS overlay_rotation NUMERIC NOT NULL DEFAULT 0
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS swatch_zoom NUMERIC NOT NULL DEFAULT 1
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS swatch_offset_x NUMERIC NOT NULL DEFAULT 0
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS swatch_offset_y NUMERIC NOT NULL DEFAULT 0
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS swatch_rotation NUMERIC NOT NULL DEFAULT 0
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS color_filter TEXT
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS base_image_zoom NUMERIC NOT NULL DEFAULT 1
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS base_image_offset_x NUMERIC NOT NULL DEFAULT 0
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS base_image_offset_y NUMERIC NOT NULL DEFAULT 0
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS size_surcharge_per_step NUMERIC NOT NULL DEFAULT 0
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS diamond_shape_overlays TEXT NOT NULL DEFAULT '{}'
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS only_white_gold BOOLEAN NOT NULL DEFAULT FALSE
  `;
  await sql`
    ALTER TABLE custom_ring_choices ADD COLUMN IF NOT EXISTS is_white_gold_option BOOLEAN NOT NULL DEFAULT FALSE
  `;
}

// ── Row mappers ───────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRing(row: any): CustomRing {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    basePrice: parseFloat(row.base_price),
    baseImage: row.base_image,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDiamondShapeOverlays(raw: unknown): Record<string, DiamondShapeOverlay> {
  if (typeof raw !== "string" || !raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, DiamondShapeOverlay> = {};
    for (const [shape, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (!v || typeof v !== "object") continue;
      const o = v as Record<string, unknown>;
      out[shape] = {
        x: parseFloat(String(o.x)) || 50,
        y: parseFloat(String(o.y)) || 50,
        width: parseFloat(String(o.width)) || 20,
        rotation: parseFloat(String(o.rotation)) || 0,
      };
    }
    return out;
  } catch {
    return {};
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toChoice(row: any): CustomRingChoice {
  return {
    id: row.id,
    label: row.label,
    swatchImage: row.swatch_image,
    swatchZoom: parseFloat(row.swatch_zoom) || 1,
    swatchOffsetX: parseFloat(row.swatch_offset_x) || 0,
    swatchOffsetY: parseFloat(row.swatch_offset_y) || 0,
    swatchRotation: parseFloat(row.swatch_rotation) || 0,
    colorFilter: row.color_filter ?? null,
    overlayImage: row.overlay_image ?? null,
    overlayX: parseFloat(row.overlay_x),
    overlayY: parseFloat(row.overlay_y),
    overlayWidth: parseFloat(row.overlay_width),
    overlayRotation: parseFloat(row.overlay_rotation) || 0,
    diamondShapeOverlays: parseDiamondShapeOverlays(row.diamond_shape_overlays),
    baseImageOverride: row.base_image_override ?? null,
    baseImageZoom: parseFloat(row.base_image_zoom) || 1,
    baseImageOffsetX: parseFloat(row.base_image_offset_x) || 0,
    baseImageOffsetY: parseFloat(row.base_image_offset_y) || 0,
    priceDelta: parseFloat(row.price_delta),
    sizeSurchargePerStep: parseFloat(row.size_surcharge_per_step) || 0,
    onlyWhiteGold: Boolean(row.only_white_gold),
    isWhiteGoldOption: Boolean(row.is_white_gold_option),
    sortOrder: row.sort_order,
    stoneKind: (row.stone_kind as StoneKind | null) ?? null,
    shape: row.shape ?? null,
  };
}

// ── CRUD ─────────────────────────────────────────────────
export async function getAllCustomRings(): Promise<CustomRing[]> {
  await initCustomRingsDB();
  const rows = await sql`SELECT * FROM custom_rings ORDER BY created_at DESC`;
  return rows.map(toRing);
}

export async function getEnabledCustomRings(): Promise<CustomRing[]> {
  await initCustomRingsDB();
  const rows = await sql`SELECT * FROM custom_rings WHERE enabled = TRUE ORDER BY created_at DESC`;
  return rows.map(toRing);
}

export async function getCustomRingById(id: number): Promise<CustomRingDetail | undefined> {
  await initCustomRingsDB();
  const ringRows = await sql`SELECT * FROM custom_rings WHERE id = ${id}`;
  if (!ringRows[0]) return undefined;

  const groupRows = await sql`
    SELECT * FROM custom_ring_groups WHERE ring_id = ${id} ORDER BY sort_order ASC, id ASC
  `;
  const choiceRows = groupRows.length
    ? await sql`
        SELECT * FROM custom_ring_choices
        WHERE group_id = ANY(${groupRows.map((g) => g.id)})
        ORDER BY sort_order ASC, id ASC
      `
    : [];

  const groups: CustomRingGroup[] = groupRows.map((g) => ({
    id: g.id,
    label: g.label,
    sortOrder: g.sort_order,
    kind: (g.kind as GroupKind) ?? "generic",
    placeholder: g.placeholder ?? "",
    priceDelta: parseFloat(g.price_delta) || 0,
    choices: choiceRows.filter((c) => c.group_id === g.id).map(toChoice),
  }));

  return { ...toRing(ringRows[0]), groups };
}

export interface GroupWithRing {
  ringId: number;
  ringName: string;
  group: CustomRingGroup;
}

export async function getAllGroupsWithChoices(): Promise<GroupWithRing[]> {
  await initCustomRingsDB();
  const rings = await sql`SELECT id, name FROM custom_rings`;
  const groupRows = await sql`SELECT * FROM custom_ring_groups ORDER BY ring_id ASC, sort_order ASC, id ASC`;
  const choiceRows = groupRows.length
    ? await sql`
        SELECT * FROM custom_ring_choices
        WHERE group_id = ANY(${groupRows.map((g) => g.id)})
        ORDER BY sort_order ASC, id ASC
      `
    : [];

  return groupRows.map((g) => ({
    ringId: g.ring_id,
    ringName: rings.find((r) => r.id === g.ring_id)?.name ?? "?",
    group: {
      id: g.id,
      label: g.label,
      sortOrder: g.sort_order,
      kind: (g.kind as GroupKind) ?? "generic",
      placeholder: g.placeholder ?? "",
      priceDelta: parseFloat(g.price_delta) || 0,
      choices: choiceRows.filter((c) => c.group_id === g.id).map(toChoice),
    },
  }));
}

export async function createCustomRingShell(name: string, basePrice: number): Promise<CustomRing> {
  await initCustomRingsDB();
  const rows = await sql`
    INSERT INTO custom_rings (name, description, base_price, base_image, enabled)
    VALUES (${name}, '', ${basePrice}, '', TRUE)
    RETURNING *
  `;
  return toRing(rows[0]);
}

export async function replaceCustomRing(
  id: number,
  fields: RingFieldsInput,
  groups: GroupInput[]
): Promise<CustomRingDetail | undefined> {
  await initCustomRingsDB();

  const ringRows = await sql`
    UPDATE custom_rings SET
      name        = ${fields.name},
      description = ${fields.description},
      base_price  = ${fields.basePrice},
      base_image  = ${fields.baseImage},
      enabled     = ${fields.enabled},
      updated_at  = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  if (!ringRows[0]) return undefined;

  await sql`DELETE FROM custom_ring_groups WHERE ring_id = ${id}`;

  for (const group of groups) {
    const groupRows = await sql`
      INSERT INTO custom_ring_groups (ring_id, label, sort_order, kind, placeholder, price_delta)
      VALUES (${id}, ${group.label}, ${group.sortOrder}, ${group.kind}, ${group.placeholder}, ${group.priceDelta})
      RETURNING id
    `;
    const groupId = groupRows[0].id;
    for (const choice of group.choices) {
      await sql`
        INSERT INTO custom_ring_choices
          (group_id, label, swatch_image, swatch_zoom, swatch_offset_x, swatch_offset_y, swatch_rotation, color_filter, overlay_image, overlay_x, overlay_y, overlay_width, overlay_rotation, diamond_shape_overlays, base_image_override, base_image_zoom, base_image_offset_x, base_image_offset_y, price_delta, size_surcharge_per_step, only_white_gold, is_white_gold_option, sort_order, stone_kind, shape)
        VALUES (
          ${groupId}, ${choice.label}, ${choice.swatchImage}, ${choice.swatchZoom}, ${choice.swatchOffsetX}, ${choice.swatchOffsetY}, ${choice.swatchRotation}, ${choice.colorFilter},
          ${choice.overlayImage}, ${choice.overlayX}, ${choice.overlayY}, ${choice.overlayWidth}, ${choice.overlayRotation}, ${JSON.stringify(choice.diamondShapeOverlays ?? {})}, ${choice.baseImageOverride}, ${choice.baseImageZoom}, ${choice.baseImageOffsetX}, ${choice.baseImageOffsetY}, ${choice.priceDelta}, ${choice.sizeSurchargePerStep}, ${choice.onlyWhiteGold}, ${choice.isWhiteGoldOption}, ${choice.sortOrder},
          ${choice.stoneKind}, ${choice.shape}
        )
      `;
    }
  }

  return getCustomRingById(id);
}

export async function deleteCustomRing(id: number): Promise<boolean> {
  await initCustomRingsDB();
  const rows = await sql`DELETE FROM custom_rings WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
