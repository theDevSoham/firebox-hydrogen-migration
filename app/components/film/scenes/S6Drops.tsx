import {DropPoster, JoinPoster} from '~/components/film/cards/DropPoster';
import {S6Motion} from '~/components/film/motion/S6Motion';
import type {Drop, Film} from '~/lib/film/model';

// S6 · Only 20. The poster wall: live, next, past drops stamped, then the slot for the next one.

type S6DropsProps = {
  heading: Film['dropsHeading'];
  drops: Drop[];
  whatsappNumber: string;
  nextDropHref: string;
};

export function S6Drops({
  heading: text,
  drops,
  whatsappNumber,
  nextDropHref,
}: S6DropsProps) {
  return (
    <S6Motion>
      <section
        className="s6 fb-halftone"
        data-chapter
        data-theme="red"
        data-scene="S6"
        aria-labelledby="s6-title"
      >
        <div className="s6-head">
          <h2 id="s6-title" className="fb-anton fb-distress s6-title">
            {text.title}
          </h2>
          <p className="fb-yanone s6-sub">{text.sub}</p>
        </div>
        <div className="s6-scroller" role="region" aria-label="Drops">
          <ul className="s6-row">
            {drops.map((drop) => (
              <DropPoster
                key={drop.id}
                drop={drop}
                whatsappNumber={whatsappNumber}
              />
            ))}
            <JoinPoster href={nextDropHref} />
          </ul>
        </div>
        <div className="s6-edge" aria-hidden="true" />
      </section>
    </S6Motion>
  );
}
