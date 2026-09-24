import { useState } from "react";
import { optimizedImage } from "../utils/cloudinaryUrl.js";

// Products now carry a full Cloudinary URL from the backend. This still
// falls back to a quiet placeholder panel (with the poster's name) instead
// of a broken-image icon if a URL ever 404s. While the image itself is
// still downloading, the frame shows a soft pulsing placeholder instead of
// popping in abruptly or sitting blank.
//
// `width` is the pixel width to actually request from Cloudinary (about 2x
// the on-screen size covers retina screens). Keeps the site fast by never
// shipping the full original upload for a small thumbnail.
export default function PosterImage({ src, alt, className = "", aspect = "aspect-[2/3]", width = 480 }) {
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showSkeleton = !broken && src && !loaded;

  return (
    <div className={`poster-frame overflow-hidden ${aspect} ${showSkeleton ? "is-loading" : ""} ${className}`}>
      {!broken && src && (
        <img
          src={optimizedImage(src, width)}
          alt={alt}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${loaded ? "loaded" : ""}`}
          onLoad={() => setLoaded(true)}
          onError={() => setBroken(true)}
        />
      )}
      {(broken || !src) && (
        <div className="poster-fallback">
          <span>{alt}</span>
        </div>
      )}
    </div>
  );
}
