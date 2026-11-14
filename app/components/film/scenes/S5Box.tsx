import {Img} from '~/components/film/media/Img';
import {S5Motion} from '~/components/film/motion/S5Motion';
import {Lines} from '~/components/film/ui/Lines';
import {Placeholder} from '~/components/film/ui/Placeholder';
import type {Film} from '~/lib/film/model';

// S5 · Open the box. The static frame is the open box; motion adds the closed box,
// the glowing seam and the lift-off lid on top.

export function S5Box({box: text}: {box: Film['box']}) {
  const closed = text.closed;

  return (
    <S5Motion>
      <div className="s5-approach fb-kraft" data-chapter data-theme="kraft">
        <span className="fb-tape s5-tape" aria-hidden="true" />
        <span className="s5-scrawl">{text.scrawl}</span>
      </div>
      <section className="s5" data-chapter data-theme="night" data-scene="S5">
        <div className="s5-reveal">
          <Img
            image={text.open}
            alt={text.open.alt}
            fill
            sizes="100vw"
            className="fb-fill s5-open"
          />
          <canvas className="fb-smoke" aria-hidden="true" />
          <Placeholder>
            Video stand-in · pulled pork, pulled apart · 6 s loop
          </Placeholder>
        </div>
        {/* Motion only: two copies of the closed box, split at the seam (65.5% of its height). */}
        <div className="s5-half s5-lid" aria-hidden="true">
          <Img image={closed} alt="" sizes="120vh" />
        </div>
        <div className="s5-half s5-base" aria-hidden="true">
          <Img image={closed} alt="" sizes="120vh" />
        </div>
        <div className="s5-seam" aria-hidden="true" />
        <div className="s5-copy">
          <p className="fb-fraunces s5-line">
            <span>
              <Lines text={text.line} />
            </span>
          </p>
          <span className="fb-yanone s5-sub">{text.sub}</span>
        </div>
      </section>
      <div className="s5-spacer" aria-hidden="true" />
    </S5Motion>
  );
}
