import {Img} from '~/components/film/media/Img';
import {S8Motion} from '~/components/film/motion/S8Motion';
import {Lines} from '~/components/film/ui/Lines';
import {Placeholder} from '~/components/film/ui/Placeholder';
import {instagramUrl} from '~/lib/film/format';
import type {Film} from '~/lib/film/model';

// S8 · Behind the Pit. A charred edge burns the cream away; the colour drains to black and white.

export function S8Behind({
  behind: text,
  instagram,
}: {
  behind: Film['behind'];
  instagram: string;
}) {
  return (
    <S8Motion>
      <section
        className="s8"
        data-chapter
        data-theme="bw"
        data-scene="S8"
        aria-labelledby="s8-title"
      >
        <div className="s8-top" aria-hidden="true" />
        <div className="s8-art">
          <Img
            image={text.photo}
            alt={text.photo.alt}
            fill
            sizes="100vw"
            className="fb-fill"
          />
        </div>
        <h2 id="s8-title" className="fb-anton s8-title">
          <Lines text={text.title} />
        </h2>
        <div className="s8-lower">
          <span className="fb-yanone s8-byline">{text.byline}</span>
          <p className="s8-story">
            <Lines text={text.story} />
          </p>
          <a
            className="s8-link"
            href={instagramUrl(instagram)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {text.linkText}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        <Placeholder>
          Photo stand-in · Hreed at the pit, night, B&amp;W
        </Placeholder>
      </section>
    </S8Motion>
  );
}
