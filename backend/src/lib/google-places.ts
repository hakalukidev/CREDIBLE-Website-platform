/**
 * Google Places API (classic) — minimal photo fetcher.
 *
 * Why a hand-rolled wrapper instead of `@googlemaps/places`? The SDK pulls in
 * 100+ transitive deps and we only need two endpoints. A 30-line fetch is
 * safer, smaller, and easier to audit.
 *
 * Flow:
 *   1. Place Details (classic) with `fields=photos` returns up to 10 photo
 *      metadata objects, each carrying a short-lived `photo_reference`.
 *   2. The Photo media endpoint (`/maps/api/place/photo`) returns a 302 to a
 *      stable URL on Google's usercontent CDN (lh3.googleusercontent.com),
 *      which `next/image` is already configured to optimize (covered by
 *      `.googleusercontent.com` in `IMAGE_HOST_PATTERNS`).
 *   3. We resolve the redirect once at write time and persist the final URL.
 *
 * Cost: 1 Place Details call + N Photo calls per business. Cached forever
 * after — Google's usercontent URLs are stable.
 */

import { env } from '../config/env';

const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const PLACE_PHOTO_URL = 'https://maps.googleapis.com/maps/api/place/photo';

const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_TIMEOUT_MS = 10_000;
const PHOTO_FETCH_TIMEOUT_MS = 15_000;

/** Single photo record returned by Place Details. */
export interface PlacePhotoMeta {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions?: string[];
}

interface PlaceDetailsPhotosResponse {
  status: string;
  photos?: PlacePhotoMeta[];
  error_message?: string;
}

/**
 * Fetch Place Details photos for a `placeId`.
 *
 * @throws if `GOOGLE_PLACES_API_KEY` is unset or the API returns an error status.
 */
export async function fetchPlacePhotoMeta(placeId: string): Promise<PlacePhotoMeta[]> {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GOOGLE_PLACES_API_KEY is not configured. Set it in backend/.env to enable Places photo lookups.',
    );
  }
  const url = new URL(PLACE_DETAILS_URL);
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'photos');
  url.searchParams.set('key', apiKey);

  const res = await fetch(url, { signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS) });
  if (!res.ok) {
    throw new Error(`Place Details HTTP ${res.status}`);
  }
  const data = (await res.json()) as PlaceDetailsPhotosResponse;
  if (data.status !== 'OK') {
    throw new Error(`Place Details API error: ${data.status}${data.error_message ? ` — ${data.error_message}` : ''}`);
  }
  return data.photos ?? [];
}

/**
 * Resolve a Place Photo media URL to its final usercontent URL by following
 * the 302 redirect. Throws if the redirect chain doesn't terminate at a
 * Google usercontent host.
 */
async function resolvePhotoUrl(mediaUrl: string): Promise<string> {
  // fetch follows redirects by default; set `redirect: 'follow'` explicitly.
  const res = await fetch(mediaUrl, {
    method: 'HEAD',
    redirect: 'follow',
    signal: AbortSignal.timeout(PHOTO_FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Place Photo HTTP ${res.status}`);
  }
  const finalUrl = res.url;
  if (!finalUrl.includes('googleusercontent.com')) {
    throw new Error(`Unexpected final photo URL host: ${finalUrl}`);
  }
  return finalUrl;
}

/**
 * Fetch up to `count` stable photo URLs for a Google Place.
 *
 * Returns an empty array (does NOT throw) when the API key is missing or the
 * Place has no photos — callers can use this as a soft opt-in.
 *
 * Throws on hard errors (Place Details HTTP error, bad placeId, etc.) so
 * the caller can log and decide whether to skip the business.
 */
export async function fetchPlacePhotos(
  placeId: string,
  count = 6,
  maxWidth = DEFAULT_MAX_WIDTH,
): Promise<string[]> {
  if (!env.GOOGLE_PLACES_API_KEY) return [];

  const metas = await fetchPlacePhotoMeta(placeId);
  const picks = metas.slice(0, count);
  const apiKey = env.GOOGLE_PLACES_API_KEY;

  const urls = await Promise.all(
    picks.map(async (meta) => {
      const mediaUrl = new URL(PLACE_PHOTO_URL);
      mediaUrl.searchParams.set('maxwidth', String(maxWidth));
      mediaUrl.searchParams.set('photo_reference', meta.photo_reference);
      mediaUrl.searchParams.set('key', apiKey);
      return resolvePhotoUrl(mediaUrl.toString());
    }),
  );
  return urls;
}