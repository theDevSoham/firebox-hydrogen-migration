import type {FilmImage} from '~/lib/film/model';
import {fetchPriority, imageUrl, srcSet} from './Img';

// Art-directed full-bleed image: one file for phones, another from 768px up (S1's `art_phone`
// and `art`, PORTING-DECISIONS.md · C).

const DESKTOP_WIDTHS = [768, 1080, 1440, 1920, 2560, 2880];
const PHONE_WIDTHS = [390, 640, 828, 1080, 1290];

type ArtPictureProps = {
  desktop: FilmImage;
  phone: FilmImage;
  alt: string;
  className?: string;
  /** The LCP image: fetch it first and never lazy-load it. */
  priority?: boolean;
};

export function ArtPicture({
  desktop,
  phone,
  alt,
  className,
  priority,
}: ArtPictureProps) {
  return (
    <picture>
      <source
        media="(max-width: 767px)"
        srcSet={srcSet(phone.url, PHONE_WIDTHS)}
        sizes="100vw"
      />
      <img
        src={imageUrl(desktop.url, 1440)}
        srcSet={srcSet(desktop.url, DESKTOP_WIDTHS)}
        sizes="100vw"
        width={desktop.width || undefined}
        height={desktop.height || undefined}
        alt={alt}
        className={className}
        {...fetchPriority(priority ? 'high' : undefined)}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
      />
    </picture>
  );
}
