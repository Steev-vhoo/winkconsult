import "server-only";
import { del, put } from "@vercel/blob";

/* Image uploads go to Vercel Blob (public URLs on a CDN). Connect a Blob store to the
   Vercel project and BLOB_READ_WRITE_TOKEN is added automatically. */

export const MAX_IMAGE_MB = 4; // Vercel functions accept request bodies up to 4.5 MB

const TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { ext: "webp", magic: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
  "image/gif": { ext: "gif", magic: (b) => b.subarray(0, 4).toString() === "GIF8" },
};

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export function storageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** True for a non-empty file field from a form. */
export function hasFile(v: FormDataEntryValue | null): v is File {
  return typeof v === "object" && v !== null && "size" in v && v.size > 0;
}

export async function uploadImage(file: File, folder: "posts" | "site"): Promise<UploadResult> {
  if (!storageConfigured()) {
    return { ok: false, error: "Image uploads aren't switched on yet. In Vercel, connect a Blob store to this project (Storage → Blob), then redeploy." };
  }
  const kind = TYPES[file.type];
  if (!kind) return { ok: false, error: "Please use a JPG, PNG, WebP or GIF image." };
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return { ok: false, error: `Images must be ${MAX_IMAGE_MB} MB or smaller. Try resizing it first.` };

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!kind.magic(bytes)) return { ok: false, error: "That file doesn't look like a valid image." };

  const base = file.name.replace(/\.[^.]*$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "image";
  try {
    const blob = await put(`${folder}/${base}.${kind.ext}`, bytes, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return { ok: true, url: blob.url };
  } catch (e) {
    console.error("[upload]", e);
    return { ok: false, error: "The image couldn't be uploaded. Please try again." };
  }
}

/** URLs that point at our Blob store (never delete anything else). */
export function isStoredImage(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith(".public.blob.vercel-storage.com")) return true;
    const api = process.env.VERCEL_BLOB_API_URL; // local testing only
    return !!api && u.origin === new URL(api).origin;
  } catch {
    return false;
  }
}

/** Best-effort removal of an image that's no longer used. */
export async function deleteImage(url: string | null | undefined) {
  if (!storageConfigured() || !isStoredImage(url)) return;
  try {
    await del(url);
  } catch (e) {
    console.error("[upload] delete failed", e);
  }
}
