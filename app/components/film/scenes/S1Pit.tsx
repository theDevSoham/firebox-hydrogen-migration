import {ArtPicture} from '~/components/film/media/ArtPicture';
import {S1Motion} from '~/components/film/motion/S1Motion';
import {Cta} from '~/components/film/ui/Cta';
import {Arrowhead} from '~/components/film/ui/icons';
import {Placeholder} from '~/components/film/ui/Placeholder';
import {Smoke} from '~/components/film/media/Smoke';
import type {Film} from '~/lib/film/model';

// S1 · The pit. Establishing shot: rooftop at dusk, one line, one button.

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
            {/* Orders go through the cart now: the red button glides to the film's menu, the
                cream one opens the full menu page (/menu). */}
            <Cta href="#menu" size="l" glyph={false}>
              {text.cta}
            </Cta>
            <a className="fb-cta fb-cta--l s1-menu" href="/menu">
              <span className="s1-menu__label">{text.menuCta}</span>
              <Arrowhead />
            </a>
          </div>
          <Placeholder>Concept art · smoke is a stand-in for video</Placeholder>
        </div>
      </section>
    </S1Motion>
  );
}
