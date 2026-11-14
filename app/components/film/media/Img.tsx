import type {ImgHTMLAttributes} from 'react';
import type {FilmImage} from '~/lib/film/model';

// A plain <img> with a width-based srcset, standing in for firebox-official's CloudImg.
// URLs use the Shopify CDN's own transform parameters (width, height, crop), so the same markup
// resizes for real once images come from cdn.shopify.com (build order step 3). The static
// placeholders in public/ ignore the query string and serve the original.
//
// Cloudinary's subject-aware crop has no Shopify equivalent: `aspect` crops around the centre
// (PORTING-DECISIONS.md · A).

const WIDTHS = [384, 640, 750, 828, 1080, 1200, 1920, 2048];

/** The image at `width` (and cropped to `aspect`, width / height, when given). */
export function imageUrl(url: string, width: number, aspect?: number): string {
  const params = new URLSearchParams({width: String(width)});
  if (aspect) {
    params.set('height', String(Math.round(width / aspect)));
    params.set('crop', 'center');
  }
  return `${url}${url.includes('?') ? '&' : '?'}${params}`;
}

export function srcSet(url: string, widths: number[], aspect?: number): string {
  return widths.map((w) => `${imageUrl(url, w, aspect)} ${w}w`).join(', ');
}

type ImgProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcSet' | 'width' | 'height'
> & {
  image: Pick<FilmImage, 'url'> & Partial<Pick<FilmImage, 'width' | 'height'>>;
  alt: string;
  /** Intrinsic size for the box's aspect ratio; defaults to the image's own. */
  width?: number;
  height?: number;
  /** Fill the positioned parent, like next/image's `fill`. */
  fill?: boolean;
  /** Crop to this shape (width / height). Otherwise the image keeps its own. */
  aspect?: number;
  /** The LCP image: fetch it first and never lazy-load it. */
  priority?: boolean;
};

export function Img({
  image,
  alt,
  width,
  height,
  fill,
  aspect,
  sizes,
  priority,
  style,
  ...rest
}: ImgProps) {
  const w = fill ? undefined : (width ?? image.width);
  const h = fill ? undefined : (height ?? image.height);
  const responsive = Boolean(sizes || fill);
  const base = w || 640;

  return (
    <img
      {...rest}
      alt={alt}
      src={imageUrl(image.url, responsive ? 1080 : base, aspect)}
      srcSet={
        responsive
          ? srcSet(image.url, WIDTHS, aspect)
          : `${imageUrl(image.url, base, aspect)} 1x, ${imageUrl(image.url, base * 2, aspect)} 2x`
      }
      sizes={sizes ?? (fill ? '100vw' : undefined)}
      width={w}
      height={h}
      loading={priority ? 'eager' : 'lazy'}
      {...fetchPriority(priority ? 'high' : undefined)}
      decoding={priority ? 'sync' : 'async'}
      style={
        fill
          ? {
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              color: 'transparent',
              ...style,
            }
          : {color: 'transparent', ...style}
      }
    />
  );
}

/**
 * `fetchpriority` as React 18 needs it: lowercase, spread in (React 18 doesn't know the
 * camelCase prop and warns).
 */
export function fetchPriority(value?: 'high' | 'low' | 'auto') {
  return value ? ({fetchpriority: value} as Record<string, string>) : {};
}
