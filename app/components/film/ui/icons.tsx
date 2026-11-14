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
