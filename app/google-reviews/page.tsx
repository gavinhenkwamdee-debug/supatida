import Link from "next/link";
import { getGoogleReviews } from "@/lib/google-reviews";

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span style={{ color: "#FBBC04", letterSpacing: "1px" }}>
      {"★".repeat(rounded)}
      {"☆".repeat(5 - rounded)}
    </span>
  );
}

export default async function GoogleReviewsPage() {
  const data = await getGoogleReviews();
  const placeId = process.env.GOOGLE_PLACE_ID;
  // Official Google deep link — the only sanctioned way to get a review onto
  // a Google Business Profile is to send the customer to Google's own form.
  const writeReviewUrl = placeId ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}` : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--ivory)" }}>
      <div className="text-center py-6" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "white" }}>
        <Link href="/" className="inline-block">
          <h1 className="text-2xl tracking-[0.2em]" style={{ color: "var(--charcoal)" }}>SUPATIDA</h1>
          <p className="text-xs tracking-[0.3em] uppercase mt-1 font-sans" style={{ color: "var(--muted)" }}>
            Lab Grown Diamond Jewelry
          </p>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {!data ? (
          <div className="bg-white p-10 text-center" style={{ border: "1px solid var(--border)" }}>
            <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>ยังไม่ได้เชื่อมต่อ Google Reviews</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <p className="text-xs tracking-[0.4em] uppercase mb-3 font-sans" style={{ color: "var(--gold-dark)" }}>
                Google Reviews
              </p>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-3xl" style={{ color: "var(--charcoal)" }}>{data.rating.toFixed(1)}</span>
                <Stars rating={data.rating} />
              </div>
              <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>
                จาก {data.totalReviews.toLocaleString()} รีวิวบน Google
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3">
                {data.mapsUrl && (
                  <a
                    href={data.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-sans underline"
                    style={{ color: "var(--gold-dark)" }}
                  >
                    ดูรีวิวทั้งหมดบน Google Maps ↗
                  </a>
                )}
                {writeReviewUrl && (
                  <a
                    href={writeReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-sans underline"
                    style={{ color: "var(--gold-dark)" }}
                  >
                    เขียนรีวิวบน Google ↗
                  </a>
                )}
              </div>
              <div className="mx-auto mt-4 w-16 h-px" style={{ backgroundColor: "var(--border)" }} />
            </div>

            {data.reviews.length === 0 ? (
              <p className="text-center text-sm font-sans" style={{ color: "var(--muted)" }}>ยังไม่มีรีวิว</p>
            ) : (
              <div className="space-y-4">
                {data.reviews.map((r, i) => (
                  <div key={i} className="bg-white p-5" style={{ border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3 mb-2">
                      {r.authorPhoto && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.authorPhoto} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-sans truncate" style={{ color: "var(--charcoal)" }}>{r.authorName}</p>
                        <p className="text-xs font-sans" style={{ color: "var(--muted)" }}>{r.relativeTime}</p>
                      </div>
                    </div>
                    <div className="mb-2"><Stars rating={r.rating} /></div>
                    <p className="text-sm font-sans" style={{ color: "var(--charcoal)" }}>{r.text}</p>
                  </div>
                ))}
              </div>
            )}

            {writeReviewUrl && (
              <div className="bg-white p-6 mt-6 text-center" style={{ border: "1px solid var(--border)" }}>
                <p className="text-sm font-sans mb-3" style={{ color: "var(--charcoal)" }}>
                  พอใจกับบริการของเราไหมคะ? ช่วยเขียนรีวิวให้เราหน่อยได้ไหมคะ
                </p>
                <a
                  href={writeReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-3 px-8 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
                >
                  เขียนรีวิวบน Google
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
