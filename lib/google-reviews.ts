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

// Google's Place Details API only ever returns up to 5 reviews (its own
// limitation, not something a paid tier removes), sorted "most relevant".
export async function getGoogleReviews(): Promise<GooglePlaceReviews | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return null;

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=rating,user_ratings_total,reviews,url&language=th&reviews_sort=newest&key=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    if (data.status !== "OK" || !data.result) return null;

    const result = data.result;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews: GoogleReview[] = (result.reviews || []).map((r: any) => ({
      authorName: r.author_name,
      authorPhoto: r.profile_photo_url ?? null,
      rating: r.rating,
      text: r.text,
      relativeTime: r.relative_time_description,
      time: r.time,
    }));

    return {
      rating: result.rating ?? 0,
      totalReviews: result.user_ratings_total ?? 0,
      mapsUrl: result.url ?? null,
      reviews,
    };
  } catch {
    return null;
  }
}
