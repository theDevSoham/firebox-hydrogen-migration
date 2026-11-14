import {useState, type CSSProperties} from 'react';
import {Img} from '~/components/film/media/Img';
import type {FilmImage, FilmVideo} from '~/lib/film/model';

// S7's scrapbook: reels and quote cards in one pile (handoff/04-components.md · ReelCard, QuoteCard).
// One reel plays at a time, muted; tap again to stop. Until a reel's video is uploaded,
// a slow push-in on the cover stands in for it.

export type PileReel = {
  kind: 'reel';
  id: string;
  cover: FilmImage;
  /** Empty until the reel's clip is uploaded: the push-in on the cover stands in. */
  video: FilmVideo | null;
  caption: string;
  likes: string;
  /** What the reel shows, for its accessible name. */
  subject: string;
  tilt: number;
  x: string;
  y: string;
};

export type PileQuote = {
  kind: 'quote';
  id: string;
  quote: string;
  attribution: string;
  tone: 'kraft' | 'dark';
  /** Permission to quote. Until then the card says so. */
  cleared: boolean;
  tilt: number;
  x: string;
  y: string;
};

/** MP4 renditions first (Safari plays HLS natively, others don't), the smallest at least `height` tall. */
export function pickSources(video: FilmVideo, height: number) {
  const mp4 = video.sources
    .filter((s) => s.mimeType === 'video/mp4')
    .sort((a, b) => a.height - b.height);
  const best = mp4.find((s) => s.height >= height) ?? mp4.at(-1);
  return best ? [best] : video.sources;
}

export function ReelPile({items}: {items: (PileReel | PileQuote)[]}) {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <div className="s7-pile">
      {items.map((item) => {
        const style = {
          '--r': `${item.tilt}deg`,
          '--x': item.x,
          '--y': item.y,
        } as CSSProperties;

        if (item.kind === 'quote') {
          return (
            <figure
              key={item.id}
              className={`fb-quote${item.tone === 'kraft' ? ' fb-kraft' : ''}`}
              data-tone={item.tone}
              data-r={item.tilt}
              style={style}
            >
              {item.tone === 'kraft' && (
                <span className="fb-tape fb-quote__tape" aria-hidden="true" />
              )}
              <blockquote>{item.quote}</blockquote>
              <figcaption>{item.attribution}</figcaption>
              {!item.cleared && (
                <span className="fb-quote__tag">
                  Placeholder · needs permission
                </span>
              )}
            </figure>
          );
        }

        const id = item.id;
        const on = playing === id;
        return (
          <button
            key={id}
            type="button"
            className="fb-reel"
            data-r={item.tilt}
            style={style}
            aria-pressed={on}
            onClick={() => setPlaying(on ? null : id)}
          >
            <span className="fb-reel__img">
              <Img
                image={item.cover}
                alt=""
                width={item.cover.width || 360}
                height={item.cover.height || 640}
                sizes="240px"
              />
              {item.video && on && (
                <video
                  className="fb-fill"
                  poster={item.video.poster?.url}
                  muted
                  playsInline
                  loop
                  autoPlay
                >
                  {pickSources(item.video, 720).map((source) => (
                    <source
                      key={source.url}
                      src={source.url}
                      type={source.mimeType}
                    />
                  ))}
                </video>
              )}
              <span className="fb-reel__play" aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  focusable="false"
                >
                  <path d="M6 3.5 19 11 6 18.5Z" fill="currentColor" />
                </svg>
              </span>
              <span className="fb-reel__bar" aria-hidden="true" />
            </span>
            {/* The visible caption and likes are the button's name, with the rest for screen readers. */}
            <span className="fb-reel__foot">
              <span>
                <span className="sr-only">Play reel: </span>
                {item.caption}
                <span className="sr-only">, {item.subject},</span>
              </span>
              <span>
                {item.likes}
                <span className="sr-only"> likes</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
