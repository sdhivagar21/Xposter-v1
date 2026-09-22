import { useState } from "react";
import { optimizedImage } from "../utils/cloudinaryUrl.js";

// Products now carry a full Cloudinary URL from the backend. This still
// falls back to a quiet placeholder panel (with the poster's name) instead
// of a broken-image icon if a URL ever 404s.
//
// `width` is the pixel width to actually request from Cloudinary (about 2x
// the on-screen size covers retina screens). Keeps the site fast by never
// shipping the full original upload for a small thumbnail.
export default function PosterImage({ src, alt, className = "", aspect = "aspect-[2/3]", width = 480 }) {
  const [broken, setBroken] = useState(false);

  return (
    <div className={`poster-frame overflow-hidden ${aspect} ${className}`}>
      {!broken && src && (
        <img
          src={optimizedImage(src, width)}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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