import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// "Power" groups drive the special ring-stone selection UI: main_power lets the
// customer pick diamond (any shape) or gemstone (round only), secondary_power is
// always a small round stone, tertiary_power is always a square gemstone.
export type GroupKind = "generic" | "main_power" | "secondary_power" | "tertiary_power";
export type StoneKind = "diamond" | "gem";
export const DIAMOND_SHAPES = ["pear", "emerald", "baguette", "heart", "oval", "round", "princess", "marquise"] as const;
export type DiamondShape = (typeof DIAMOND_SHAPES)[number];

export interface CustomRingChoice {
  id: number;
  label: string;
  swatchImage: string;
  overlayImage: string | null;
  overlayX: number;
  overlayY: number;
  overlayWidth: number;
  baseImageOverride: string | null;
  priceDelta: number;
  sortOrder: number;
  stoneKind: StoneKind | null;
  shape: string | null;
}

export interface CustomRingGroup {
  id: number;
  label: string;
  sortOrder: number;
  kind: GroupKind;
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
  overlayImage: string | null;
  overlayX: number;
  overlayY: number;
  overlayWidth: number;
  baseImageOverride: string | null;
  priceDelta: number;
  sortOrder: number;
  stoneKind: StoneKind | null;
  shape: string | null;
}

export interface GroupInput {
  label: string;
  sortOrder: number;
  kind: GroupKind;
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
function toChoice(row: any): CustomRingChoice {
  return {
    id: row.id,
    label: row.label,
    swatchImage: row.swatch_image,
    overlayImage: row.overlay_image ?? null,
    overlayX: parseFloat(row.overlay_x),
    overlayY: parseFloat(row.overlay_y),
    overlayWidth: parseFloat(row.overlay_width),
    baseImageOverride: row.base_image_override ?? null,
    priceDelta: parseFloat(row.price_delta),
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
      INSERT INTO custom_ring_groups (ring_id, label, sort_order, kind)
      VALUES (${id}, ${group.label}, ${group.sortOrder}, ${group.kind})
      RETURNING id
    `;
    const groupId = groupRows[0].id;
    for (const choice of group.choices) {
      await sql`
        INSERT INTO custom_ring_choices
          (group_id, label, swatch_image, overlay_image, overlay_x, overlay_y, overlay_width, base_image_override, price_delta, sort_order, stone_kind, shape)
        VALUES (
          ${groupId}, ${choice.label}, ${choice.swatchImage}, ${choice.overlayImage},
          ${choice.overlayX}, ${choice.overlayY}, ${choice.overlayWidth}, ${choice.baseImageOverride}, ${choice.priceDelta}, ${choice.sortOrder},
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
