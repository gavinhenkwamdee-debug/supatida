export interface GoogleReview {
  authorName: string;
  authorPhoto: string | null;
  rating: number;
  text: string;
  relativeTime: string;
  time: number;
}

export interface GooglePlaceReviews {
  rating: number;
  totalReviews: number;
  mapsUrl: string | null;
  reviews: GoogleReview[];
}

// Places API (New) — Google's Place Details endpoint only ever returns up
// to 5 reviews (its own limitation, not something a paid tier removes),
// sorted "most relevant" by default.
export async function getGoogleReviews(): Promise<GooglePlaceReviews | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return null;

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=th`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const result = await res.json();
    if (!result || typeof result.rating !== "number") return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews: GoogleReview[] = (result.reviews || []).map((r: any) => ({
      authorName: r.authorAttribution?.displayName ?? "",
      authorPhoto: r.authorAttribution?.photoUri ?? null,
      rating: r.rating,
      text: r.text?.text ?? "",
      relativeTime: r.relativePublishTimeDescription ?? "",
      time: r.publishTime ? Date.parse(r.publishTime) : 0,
    }));

    return {
      rating: result.rating ?? 0,
      totalReviews: result.userRatingCount ?? 0,
      mapsUrl: result.googleMapsUri ?? null,
      reviews,
    };
  } catch {
    return null;
  }
}
