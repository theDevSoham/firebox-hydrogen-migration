import {S2Motion} from '~/components/film/motion/S2Motion';
import {Chip} from '~/components/film/ui/Chip';
import type {Film} from '~/lib/film/model';

// S2 · Ash to ember. The manifesto; under motion the words heat from ash to cream.

export function S2Manifesto({manifesto: text}: {manifesto: Film['manifesto']}) {
  return (
    <S2Motion>
      <section className="s2" data-chapter data-theme="night" data-scene="S2">
        <div className="s2-inner">
          <p className="fb-anton s2-text">{text.text}</p>
          <Chip className="s2-chip" tilt={3} wipe="left">
            {text.chip}
          </Chip>
        </div>
      </section>
    </S2Motion>
  );
}
