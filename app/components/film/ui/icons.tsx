// Inline glyphs, so they never fall back to a system font (handoff/03-fonts.md).

export function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 2.6a9.4 9.4 0 0 0-8.1 14.2L2.6 21.4l4.7-1.2A9.4 9.4 0 1 0 12 2.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8.7 7.5c.3-.3.8-.3 1 .1l.9 1.9c.1.3 0 .6-.2.8l-.6.6a6 6 0 0 0 2.9 2.9l.6-.6c.2-.2.5-.3.8-.2l1.9.9c.4.2.4.7.1 1-.6.8-1.6 1.2-2.6.9a8.2 8.2 0 0 1-5.4-5.4c-.3-1 .1-2 .6-2.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** The ➤ bullet, drawn as an arrowhead. */
export function Arrowhead() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <path d="M1.5 1.2 13 7 1.5 12.8 4.6 7Z" fill="currentColor" />
    </svg>
  );
}

/**
 * The cart: a takeaway box with steam rising, not a trolley. The lid and steam are their own
 * groups so the add-to-cart film can open the lid and puff the steam.
 */
export function BoxIcon() {
  return (
    <svg
      className="fb-box-icon"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <g
        data-steam
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M11.5 9.5c-1.4-1.3-1.4-2.6 0-3.9s1.4-2.6 0-3.9" />
        <path d="M16 9.5c-1.4-1.3-1.4-2.6 0-3.9s1.4-2.6 0-3.9" />
        <path d="M20.5 9.5c-1.4-1.3-1.4-2.6 0-3.9s1.4-2.6 0-3.9" />
      </g>
      <path data-lid d="M5 12h22l-1.6 3.6H6.6Z" fill="currentColor" />
      <path d="M7.2 17.2h17.6L23 29H9Z" fill="currentColor" />
      <path
        d="M13 21.5h6"
        stroke="var(--fb-box-cut, var(--fb-red))"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Remove: a dustbin whose lid tips open as the item drops in. */
export function BinIcon() {
  return (
    <svg
      className="fb-bin-icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g data-lid>
        <path d="M3.5 6.5h17" />
        <path d="M9 6.5V4h6v2.5" />
      </g>
      <path d="M5.5 9.5 6.6 21h10.8l1.1-11.5" />
      <path d="M10 12.5v5.5M14 12.5v5.5" />
    </svg>
  );
}

/** The empty cart: an open kraft takeaway box with nothing in it, one wisp of smoke above. */
export function EmptyBoxArt() {
  return (
    <svg
      className="fb-empty-box"
      viewBox="0 0 160 140"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="fb-empty-box__wisp"
        d="M80 54c-9-7 9-13 0-20s9-13 0-20"
      />
      <path className="fb-empty-box__flap" d="M32 64 8 44l44-5 12 25Z" />
      <path className="fb-empty-box__flap" d="m128 64 24-20-44-5-12 25Z" />
      <path className="fb-empty-box__inside" d="M32 64h96l-4 10H36Z" />
      <path className="fb-empty-box__body" d="M36 74h88l-10 58H46Z" />
      <path className="fb-empty-box__band" d="M41 94h78" />
    </svg>
  );
}

/** Close: a cross. */
export function CrossIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  );
}
