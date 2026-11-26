import {fetchPriority as fetchPriorityAttr} from '~/components/film/media/Img';
import type {CSSProperties} from 'react';

// The traced wordmark, never typeset (handoff/04-components.md · Logo).
// All files share the full logo viewBox, 329 × 176.6.
const LOGO_W = 329;
const LOGO_H = 177;

const FILES = {
  normal: '/brand/logo-normal.svg',
  reversed: '/brand/logo-reversed.svg',
  'mono-cream': '/brand/logo-mono-cream.svg',
  'mono-char': '/brand/logo-mono-char.svg',
} as const;

const GROUPS = ['the', 'fire', 'box'] as const;

export type LogoVariant = keyof typeof FILES | 'tag' | 'groups';

type LogoProps = {
  /** `tag` (reversed on the ember tag) is the default on dark grounds. */
  variant?: LogoVariant;
  /** Rendered width of the wordmark itself: a px number or any CSS length. Minimum 104px (the tag may go to 90px on phones). */
  width: number | string;
  /** "The Firebox" once per view; pass "" where a parent already names it. */
  alt?: string;
  preload?: boolean;
  /** Not on screen at first (a nav variant for another chapter, the intro's layers): fetched only once it shows. */
  lazy?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
  className?: string;
};

export function Logo({
  variant = 'tag',
  width,
  alt = 'The Firebox',
  preload,
  lazy,
  fetchPriority,
  className,
}: LogoProps) {
  const style = {
    '--logo-w': typeof width === 'number' ? `${width}px` : width,
  } as CSSProperties;

  if (variant === 'groups') {
    // THE · FIRE · BOX as three layers on the same viewBox, for the S0 rise.
    return (
      <span
        className={['fb-logo-groups', className].filter(Boolean).join(' ')}
        style={style}
        role="img"
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
      >
        {GROUPS.map((g) => (
          <img
            key={g}
            src={`/brand/logo-group-${g}.svg`}
            alt=""
            width={LOGO_W}
            height={LOGO_H}
            data-group={g}
            loading={lazy ? 'lazy' : 'eager'}
            decoding="async"
          />
        ))}
      </span>
    );
  }

  const img = (
    <img
      src={FILES[variant === 'tag' ? 'reversed' : variant]}
      alt={alt}
      width={LOGO_W}
      height={LOGO_H}
      className="fb-logo"
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      {...fetchPriorityAttr(preload ? 'high' : fetchPriority)}
    />
  );

  if (variant === 'tag') {
    return (
      <span
        className={['fb-logo-tag', className].filter(Boolean).join(' ')}
        style={style}
      >
        {img}
      </span>
    );
  }

  return (
    <span
      className={['inline-flex', className].filter(Boolean).join(' ')}
      style={style}
    >
      {img}
    </span>
  );
}
