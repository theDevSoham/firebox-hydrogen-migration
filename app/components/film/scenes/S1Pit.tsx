import {ArtPicture} from '~/components/film/media/ArtPicture';
import {S1Motion} from '~/components/film/motion/S1Motion';
import {Cta} from '~/components/film/ui/Cta';
import {Placeholder} from '~/components/film/ui/Placeholder';
import {Smoke} from '~/components/film/media/Smoke';
import type {Film} from '~/lib/film/model';

// S1 · The pit. Establishing shot: rooftop at dusk, one line, two buttons: down to the film's
// dishes, or across to the whole menu.

export function S1Pit({pit: text}: {pit: Film['pit']}) {
  return (
    <S1Motion>
      <section
        id="top"
        className="s1"
        data-chapter
        data-theme="night"
        data-scene="S1"
      >
        <div className="s1-card">
          <ArtPicture
            desktop={text.art}
            phone={text.artPhone}
            alt={text.art.alt}
            className="fb-fill"
            priority
          />
          <Smoke video={text.smoke} />
          <div className="s1-copy">
            <h1 className="fb-anton s1-h">{text.headline}</h1>
            <p className="fb-fraunces s1-sub">
              <span>{text.sub}</span>
            </p>
          </div>
          <div className="s1-foot">
            {/* Orders go through the cart now: the hero takes you to the menu. */}
            <Cta href="#menu" size="l" glyph={false}>
              {text.cta}
            </Cta>
            {/* The film shows a few dishes; this one opens the whole menu. */}
            <Cta
              href="/menu"
              variant="on-red"
              size="l"
              glyph={false}
              className="s1-note"
            >
              {text.note}
            </Cta>
          </div>
          <Placeholder>Concept art · smoke is a stand-in for video</Placeholder>
        </div>
      </section>
    </S1Motion>
  );
}
