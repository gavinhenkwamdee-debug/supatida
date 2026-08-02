import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export interface CustomRingChoice {
  id: number;
  label: string;
  swatchImage: string;
  overlayImage: string | null;
  overlayX: number;
  overlayY: number;
  overlayWidth: number;
  priceDelta: number;
  sortOrder: number;
}

export interface CustomRingGroup {
  id: number;
  label: string;
  sortOrder: number;
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
  priceDelta: number;
  sortOrder: number;
}

export interface GroupInput {
  label: string;
  sortOrder: number;
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
      id             SERIAL PRIMARY KEY,
      group_id       INT NOT NULL REFERENCES custom_ring_groups(id) ON DELETE CASCADE,
      label          TEXT NOT NULL,
      swatch_image   TEXT NOT NULL DEFAULT '',
      overlay_image  TEXT,
      overlay_x      NUMERIC NOT NULL DEFAULT 50,
      overlay_y      NUMERIC NOT NULL DEFAULT 50,
      overlay_width  NUMERIC NOT NULL DEFAULT 20,
      price_delta    NUMERIC NOT NULL DEFAULT 0,
      sort_order     INT NOT NULL DEFAULT 0
    )
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
    priceDelta: parseFloat(row.price_delta),
    sortOrder: row.sort_order,
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
    choices: choiceRows.filter((c) => c.group_id === g.id).map(toChoice),
  }));

  return { ...toRing(ringRows[0]), groups };
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
      INSERT INTO custom_ring_groups (ring_id, label, sort_order)
      VALUES (${id}, ${group.label}, ${group.sortOrder})
      RETURNING id
    `;
    const groupId = groupRows[0].id;
    for (const choice of group.choices) {
      await sql`
        INSERT INTO custom_ring_choices
          (group_id, label, swatch_image, overlay_image, overlay_x, overlay_y, overlay_width, price_delta, sort_order)
        VALUES (
          ${groupId}, ${choice.label}, ${choice.swatchImage}, ${choice.overlayImage},
          ${choice.overlayX}, ${choice.overlayY}, ${choice.overlayWidth}, ${choice.priceDelta}, ${choice.sortOrder}
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
