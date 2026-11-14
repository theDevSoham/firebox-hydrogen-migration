import {Img} from '~/components/film/media/Img';
import {S3Motion} from '~/components/film/motion/S3Motion';
import {Chip} from '~/components/film/ui/Chip';
import {Placeholder} from '~/components/film/ui/Placeholder';
import type {Film} from '~/lib/film/model';

// S3 · Nine hours. The held shot: the belly with its bark, the clock at 9:00.

const HOURS = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

export function S3NineHours({nineHours: text}: {nineHours: Film['nineHours']}) {
  return (
    <S3Motion>
      <section className="s3" data-chapter data-theme="night" data-scene="S3">
        <div className="s3-stage">
          <div className="s3-art">
            <Img
              image={text.raw}
              alt=""
              fill
              sizes="(max-width: 767px) 100vw, 70vw"
              className="fb-fill s3-raw"
            />
            <Img
              image={text.done}
              alt={text.done.alt}
              fill
              sizes="(max-width: 767px) 100vw, 70vw"
              className="fb-fill s3-done"
            />
            <div className="s3-line" aria-hidden="true" />
            <Placeholder>Raw frame is a mock · concept art</Placeholder>
          </div>
          <div className="s3-slate">
            <span className="fb-yanone s3-kicker">{text.kicker}</span>
            <p className="s3-clock">
              <span className="fb-anton s3-time">9:00</span>{' '}
              <span className="fb-yanone s3-hrs">hrs</span>
            </p>
            <ol className="s3-ticks" aria-hidden="true">
              {HOURS.map((h) => (
                <li key={h} data-h={h}>
                  {h}
                </li>
              ))}
            </ol>
            <p className="fb-fraunces s3-name">{text.name}</p>
            <Chip className="s3-chip" tilt={-3}>
              {text.chip}
            </Chip>
          </div>
        </div>
      </section>
    </S3Motion>
  );
}
