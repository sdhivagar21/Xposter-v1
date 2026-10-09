import { useState } from "react";
import { optimizedImage } from "../utils/cloudinaryUrl.js";

// Products now carry a full Cloudinary URL from the backend. This still
// falls back to a quiet placeholder panel (with the poster's name) instead
// of a broken-image icon if a URL ever 404s. While the image itself is
// still downloading, the frame shows the same branded logo mark as the
// full-page loading screen, centered and pulsing, instead of sitting blank.
//
// `width` is the pixel width to actually request from Cloudinary (about 2x
// the on-screen size covers retina screens). Keeps the site fast by never
// shipping the full original upload for a small thumbnail.
export default function PosterImage({ src, alt, className = "", aspect = "aspect-[2/3]", width = 480, priority = false }) {
  const [broken, setBroken] = useState(false);
  // Priority (above-the-fold) posters skip the fade-in so they paint the moment
  // their bytes arrive instead of waiting on a state update + 0.4s transition.
  const [loaded, setLoaded] = useState(priority);
  const showLoading = !broken && src && !loaded;

  return (
    <div className={`poster-frame overflow-hidden ${aspect} ${className}`}>
      {showLoading && !priority && (
        <div className="poster-loading" aria-hidden="true">
          <img src="/logo-mark.webp" alt="" width="56" height="20" className="animate-logo-pulse h-4 w-auto sm:h-5" />
        </div>
      )}
      {!broken && src && (
        <img
          src={optimizedImage(src, width)}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
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
