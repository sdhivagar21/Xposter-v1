import { useState } from "react";

// Mock products reference image filenames that don't exist on disk yet
// (real .jpg files get dropped into public/images/<category>/ later).
// This shows a lazy-loaded image and falls back to a quiet placeholder
// panel — with the product name — instead of a broken-image icon.
export default function PosterImage({ category, filename, alt, className = "", aspect = "aspect-[2/3]" }) {
  const [broken, setBroken] = useState(false);
  const src = `/images/${category}/${filename}`;

  return (
    <div className={`poster-frame overflow-hidden ${aspect} ${className}`}>
      {!broken && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setBroken(true)}
        />
      )}
      {broken && (
        <div className="poster-fallback">
          <span>{alt}</span>
        </div>
      )}
    </div>
  );
}
