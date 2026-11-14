import type {ReactNode} from 'react';
import {Arrowhead, WhatsAppGlyph} from './icons';

// Square buttons and links (handoff/04-components.md · Cta). Every order action is a real <a>
// whose href comes from waLink(); `item` names the dish for the WhatsApp click event.

type CtaProps = {
  href: string;
  children?: ReactNode;
  /** primary (red, WhatsApp glyph) · secondary (cream outline) · text (Yanone with ➤) · on-red (charcoal) · sold-out */
  variant?: 'primary' | 'secondary' | 'text' | 'on-red' | 'sold-out';
  /** L 60px · M 48px · S 48px min */
  size?: 'l' | 'm' | 's';
  /** Show the WhatsApp glyph. Defaults on for primary and on-red. */
  glyph?: boolean;
  /** Item name reported with the WhatsApp click. */
  item?: string;
  /** Read after the label by screen readers when the same label repeats, e.g. the dish name. */
  context?: string;
  className?: string;
};

export function Cta({
  href,
  children,
  variant = 'primary',
  size = 'm',
  glyph,
  item,
  context,
  className,
}: CtaProps) {
  const external = href.startsWith('http');
  const showGlyph = glyph ?? (variant === 'primary' || variant === 'on-red');
  const classes = [
    'fb-cta',
    `fb-cta--${variant}`,
    size !== 'm' && `fb-cta--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <a
      href={href}
      className={classes}
      data-wa-item={item}
      {...(external ? {target: '_blank', rel: 'noopener'} : {})}
    >
      {showGlyph && <WhatsAppGlyph />}
      {variant === 'text' ? (
        <>
          <span className="fb-cta__label">{children}</span>
          <Arrowhead />
        </>
      ) : variant === 'sold-out' ? (
        <>
          <s>Sold out</s>
          <span aria-hidden="true">·</span>
          <span>{children ?? 'Get the next drop'}</span>
        </>
      ) : (
        children
      )}
      {context && <span className="sr-only">: {context}</span>}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}
