/** The NEW flag, option B: an ember seal with a slowly turning ring of text. */
export function NewSeal({id}: {id: string}) {
  const ring = `ring-${id}`;
  return (
    <span className="fb-seal" role="img" aria-label="New">
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <defs>
          <path id={ring} d="M50 50m-37 0a37 37 0 1 1 74 0a37 37 0 1 1-74 0" />
        </defs>
        <text
          fill="currentColor"
          style={{
            font: '600 12px var(--font-label)',
            letterSpacing: '2.4px',
            textTransform: 'uppercase',
          }}
        >
          <textPath href={`#${ring}`}>
            Fresh off the pit · fresh off the pit ·
          </textPath>
        </text>
      </svg>
      <b aria-hidden="true">NEW</b>
    </span>
  );
}
