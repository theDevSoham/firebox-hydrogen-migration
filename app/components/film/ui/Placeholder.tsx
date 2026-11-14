import type {ReactNode} from 'react';

/** Small dashed label on interim media. Stays until the real asset lands. */
export function Placeholder({children}: {children: ReactNode}) {
  return <span className="fb-ph">{children}</span>;
}
