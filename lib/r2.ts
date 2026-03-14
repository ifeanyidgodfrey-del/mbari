/**
 * Cloudflare R2 client (S3-compatible via @aws-sdk/client-s3)
 * Mirrors images from TMDb to R2 to own the CDN layer.
 */

import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) throw new Error("R2_ACCOUNT_ID not set");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
}

const BUCKET = () => process.env.R2_BUCKET_NAME ?? "mbari-media";
const PUBLIC_URL = () => process.env.R2_PUBLIC_URL ?? "https://media.mbari.art";

/**
 * Check if a key already exists in R2 (avoid re-uploading)
 */
async function exists(client: S3Client, key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET(), Key: key }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch an image URL and store it in R2.
 * Returns the public URL of the stored image.
 * If R2 env vars are missing, returns the original source URL.
 */
export async function mirrorImageToR2(
  sourceUrl: string,
  key: string, // e.g. "posters/behind-the-scenes.jpg"
  contentType = "image/jpeg"
): Promise<string> {
  // Graceful fallback when R2 is not configured
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID) {
    return sourceUrl;
  }

  try {
    const client = getR2Client();

    // Skip if already uploaded
    if (await exists(client, key)) {
      return `${PUBLIC_URL()}/${key}`;
    }

    // Fetch from source
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());

    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET(),
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
        Metadata: {
          "source-url": sourceUrl,
          "uploaded-by": "mbari-import",
        },
      })
    );

    return `${PUBLIC_URL()}/${key}`;
  } catch (err) {
    console.error("[R2] mirrorImageToR2 failed:", err);
    // Fall back to original URL so import still works
    return sourceUrl;
  }
}

/**
 * Mirror TMDb poster and backdrop for a film.
 * Returns { posterUrl, backdropUrl } pointing to R2 (or original TMDb if R2 down).
 */
export async function mirrorFilmImages(
  slug: string,
  posterSrc: string | null,
  backdropSrc: string | null
): Promise<{ posterUrl: string | null; backdropUrl: string | null }> {
  const [posterUrl, backdropUrl] = await Promise.all([
    posterSrc
      ? mirrorImageToR2(posterSrc, `posters/${slug}.jpg`, "image/jpeg")
      : Promise.resolve(null),
    backdropSrc
      ? mirrorImageToR2(backdropSrc, `backdrops/${slug}.jpg`, "image/jpeg")
      : Promise.resolve(null),
  ]);
  return { posterUrl, backdropUrl };
}
