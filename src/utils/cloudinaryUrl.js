// Cloudinary lets you resize/compress/re-encode an image that's already
// uploaded just by editing its URL - no re-upload needed. This inserts a
// transformation segment right after "/upload/" so every image is served at
// roughly the size it's actually shown at, in a modern format (WebP/AVIF
// where the browser supports it) instead of the full original upload.
//
// f_auto - best format for the visitor's browser
// q_auto - automatic quality/compression (usually a big size cut with no
//          visible difference)
// w_<width> - resize to the width actually needed on screen
//
// Safe no-op for anything that isn't a Cloudinary "/upload/" URL - a local
// blob: preview, a missing image, etc. all pass through unchanged.
export function optimizedImage(url, width) {
  if (!url || typeof url !== "string") return url;
  const marker = "/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;

  const insertAt = index + marker.length;
  const transform = `f_auto,q_auto,w_${width}/`;
  return url.slice(0, insertAt) + transform + url.slice(insertAt);
}