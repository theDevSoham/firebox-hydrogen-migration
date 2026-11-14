import {ArtPicture} from '~/components/film/media/ArtPicture';
import {S1Motion} from '~/components/film/motion/S1Motion';
import {Cta} from '~/components/film/ui/Cta';
import {Placeholder} from '~/components/film/ui/Placeholder';
import {Smoke} from '~/components/film/media/Smoke';
import {waLink} from '~/lib/film/format';
import type {Film} from '~/lib/film/model';

// S1 · The pit. Establishing shot: rooftop at dusk, one line, one button.

export function S1Pit({
  pit: text,
  whatsappNumber,
}: {
  pit: Film['pit'];
  whatsappNumber: string;
}) {
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
            <Cta href={waLink(whatsappNumber)} size="l" item="Hero · Pre-order">
              {text.cta}
            </Cta>
            <span className="fb-yanone s1-note">{text.note}</span>
          </div>
          <Placeholder>Concept art · smoke is a stand-in for video</Placeholder>
        </div>
      </section>
    </S1Motion>
  );
}
