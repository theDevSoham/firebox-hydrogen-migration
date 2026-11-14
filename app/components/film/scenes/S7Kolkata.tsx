import {
  ReelPile,
  type PileQuote,
  type PileReel,
} from '~/components/film/cards/ReelPile';
import {S7Motion} from '~/components/film/motion/S7Motion';
import {instagramUrl} from '~/lib/film/format';
import type {Film} from '~/lib/film/model';

// S7 · Ki bolchhe Kolkata? Three giant words over a scrapbook pile of their reels and comments.
// Tilts and desktop positions are fixed per slot; on phones the pile becomes a zig-zag column.
// Reels and comments are lists now (PORTING-DECISIONS.md · D.2.2): the first six cards take the
// six designed slots, alternating as the original did (reel, comment, reel, reel, comment, reel);
// any extras fall back to a looser grid of positions.

type Slot = {tilt: number; x: string; y: string};

const REEL_SLOTS: Slot[] = [
  {tilt: -8, x: '6%', y: '24%'},
  {tilt: 4, x: '41%', y: '30%'},
  {tilt: -3, x: '58%', y: '18%'},
  {tilt: 7, x: '78%', y: '27%'},
];
const QUOTE_SLOTS: (Slot & {tone: PileQuote['tone']})[] = [
  {tilt: -3, x: '23%', y: '22%', tone: 'kraft'},
  {tilt: 5, x: '57%', y: '64%', tone: 'dark'},
];

const extra = (i: number): Slot => ({
  tilt: i % 2 ? 5 : -5,
  x: `${8 + ((i * 23) % 76)}%`,
  y: `${50 + ((i * 11) % 22)}%`,
});

export function S7Kolkata({
  kolkata: text,
  instagram,
}: {
  kolkata: Film['kolkata'];
  instagram: string;
}) {
  const reels: PileReel[] = text.reels.map((reel, i) => ({
    kind: 'reel',
    ...reel,
    ...(REEL_SLOTS[i] ?? extra(i)),
  }));
  const quotes: PileQuote[] = text.comments.map((comment, i) => ({
    kind: 'quote',
    id: comment.id,
    quote: comment.quote,
    attribution: comment.by,
    cleared: comment.cleared,
    ...(QUOTE_SLOTS[i] ?? {...extra(i + 4), tone: i % 2 ? 'dark' : 'kraft'}),
  }));

  // Page order (and so reading and tab order): reel, quote, reel, reel, quote, reel, then the rest.
  const pile: (PileReel | PileQuote)[] = [];
  const order = ['reel', 'quote', 'reel', 'reel', 'quote', 'reel'] as const;
  let r = 0;
  let q = 0;
  for (const kind of order) {
    if (kind === 'reel' && r < reels.length) pile.push(reels[r++]);
    if (kind === 'quote' && q < quotes.length) pile.push(quotes[q++]);
  }
  pile.push(...reels.slice(r), ...quotes.slice(q));

  const [w1, w2, w3] = text.words;

  return (
    <S7Motion>
      <section className="s7" data-chapter data-theme="light" data-scene="S7">
        <h2
          className="s7-words"
          aria-label={`${w1} ${w2} ${w3} (${text.meaning})`}
        >
          <span className="s7-w s7-w1" aria-hidden="true">
            {w1}
          </span>
          <span className="s7-w s7-w2" aria-hidden="true">
            {w2}
          </span>
          <span className="s7-w s7-w3" aria-hidden="true">
            {w3}
          </span>
        </h2>
        <ReelPile items={pile} />
        <a
          className="fb-yanone s7-handle"
          href={instagramUrl(instagram)}
          target="_blank"
          rel="noopener"
        >
          @{instagram}
          <span className="sr-only"> on Instagram (opens in a new tab)</span>
        </a>
      </section>
    </S7Motion>
  );
}
