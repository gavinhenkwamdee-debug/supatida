import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export type ReviewType = "preorder" | "product";
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: number;
  type: ReviewType;
  name: string;
  rating: number;
  text: string;
  imageUrl: string | null;
  category: string | null;
  status: ReviewStatus;
  createdAt: string;
}

// ── Schema init ───────────────────────────────────────────
export async function initReviewsDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id          SERIAL PRIMARY KEY,
      type        TEXT NOT NULL,
      name        TEXT NOT NULL,
      rating      INT NOT NULL,
      text        TEXT NOT NULL,
      image_url   TEXT,
      category    TEXT,
      status      TEXT NOT NULL DEFAULT 'pending',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

// ── Row mapper ────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toReview(row: any): Review {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    rating: row.rating,
    text: row.text,
    imageUrl: row.image_url ?? null,
    category: row.category ?? null,
    status: row.status,
    createdAt: row.created_at,
  };
}

// ── CRUD ─────────────────────────────────────────────────
export async function getApprovedReviews(): Promise<Review[]> {
  await initReviewsDB();
  const rows = await sql`
    SELECT * FROM reviews WHERE status = 'approved' ORDER BY created_at DESC
  `;
  return rows.map(toReview);
}

export async function getAllReviews(): Promise<Review[]> {
  await initReviewsDB();
  const rows = await sql`SELECT * FROM reviews ORDER BY created_at DESC`;
  return rows.map(toReview);
}

export async function createReview(
  data: Omit<Review, "id" | "createdAt" | "status">
): Promise<Review> {
  await initReviewsDB();
  const rows = await sql`
    INSERT INTO reviews (type, name, rating, text, image_url, category, status)
    VALUES (
      ${data.type},
      ${data.name},
      ${data.rating},
      ${data.text},
      ${data.imageUrl},
      ${data.category},
      'pending'
    )
    RETURNING *
  `;
  return toReview(rows[0]);
}

export async function updateReviewStatus(
  id: number,
  status: ReviewStatus
): Promise<Review | null> {
  await initReviewsDB();
  const rows = await sql`
    UPDATE reviews SET status = ${status} WHERE id = ${id} RETURNING *
  `;
  return rows[0] ? toReview(rows[0]) : null;
}

export async function deleteReview(id: number): Promise<boolean> {
  await initReviewsDB();
  const rows = await sql`DELETE FROM reviews WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
