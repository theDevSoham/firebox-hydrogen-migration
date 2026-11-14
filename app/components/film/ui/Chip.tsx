import type {CSSProperties, ReactNode} from 'react';

// The tilted label: a sticker slapped on the box (handoff/04-components.md · Chip).

type ChipProps = {
  /** Two to five words, their phrases. */
  children: ReactNode;
  /** ember (cream border, default) · cream (ember border) · amber (charcoal) · kraft (cream border) */
  colour?: 'ember' | 'cream' | 'amber' | 'kraft';
  /** S 20 · M 30 · L 44px */
  size?: 's' | 'm' | 'l';
  /** Degrees, ±2–3, alternating by scene. */
  tilt?: number;
  /** How motion wipes it on: centre-out for scene openers, left-to-right mid-scene. Static layout shows it whole. */
  wipe?: 'centre' | 'left';
  className?: string;
};

export function Chip({
  children,
  colour = 'ember',
  size = 'm',
  tilt = 3,
  wipe = 'centre',
  className,
}: ChipProps) {
  return (
    <span
      className={['fb-chip-tilt', className].filter(Boolean).join(' ')}
      style={{'--tilt': `${tilt}deg`} as CSSProperties}
    >
      <span
        className={`fb-chip fb-chip--${size} fb-chip--${colour}`}
        data-chip
        data-wipe={wipe}
      >
        {children}
      </span>
    </span>
  );
}
