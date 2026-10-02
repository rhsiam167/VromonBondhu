import { useState } from 'react';
import Icon from './Icons';
import { getImage } from '../data/imageMap';

/**
 * TRIP IMAGE — the one image component used on every card.
 *
 * Props:
 *  group    – which part of the image map: 'site' | 'destinations' | 'attractions' | 'stays' | 'food'
 *  imageKey – the key inside that group (stored on each data entry as `imageKey`)
 *  alt      – description; also shown on the placeholder
 *
 * If the key is unknown, or the file is missing / fails to load, a soft green
 * placeholder with the name is shown instead of a broken-image icon.
 */
export default function TripImage({ group, imageKey, alt, className = '' }) {
  const src = getImage(group, imageKey);
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#dff3b3] via-[#cfe9c8] to-[#a9d7d0] text-[#2f5d50] ${className}`}
      >
        <Icon name="mountain" className="h-8 w-8" />
        <span className="px-3 text-center font-heading text-sm font-semibold">{alt}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setFailedSrc(src)} className={`object-cover ${className}`} loading="lazy" />;
}
