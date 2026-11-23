import {CopyNumber} from '~/components/film/cards/CopyNumber';
import {Img} from '~/components/film/media/Img';
import {S9Motion} from '~/components/film/motion/S9Motion';
import {Chip} from '~/components/film/ui/Chip';
import {Cta} from '~/components/film/ui/Cta';
import {Smoke} from '~/components/film/media/Smoke';
import {displayNumber, instagramUrl, waLink} from '~/lib/film/format';
import type {Film, Settings} from '~/lib/film/model';

// S9 · Find the smoke. The end card, bookending S0. The floor letters and the word
// machine are decoration; the real content is above them.

export function S9Footer({
  footer: text,
  settings,
}: {
  footer: Film['footer'];
  settings: Settings;
}) {
  const machine = text.rollingWords;
  const number = displayNumber(settings.whatsappNumber);

  return (
    <S9Motion>
      <footer className="s9" data-chapter data-theme="night" data-scene="S9">
        <Img
          image={text.background}
          alt=""
          fill
          sizes="100vw"
          className="fb-fill s9-night"
        />
        <Smoke video={text.smoke} />
        <div className="fb-ember s9-ember" aria-hidden="true" />
        <div className="s9-inner">
          <div className="s9-main">
            <h2 className="fb-anton s9-h">
              {text.headline} <em>{text.highlight}</em>
            </h2>
            <Chip className="s9-chip" size="m" tilt={-3}>
              {settings.locationLabel}
            </Chip>
            <div className="s9-row">
              <Cta
                href={waLink(settings.whatsappNumber)}
                size="l"
                item="Footer · Number"
              >
                <span className="sr-only">WhatsApp </span>
                <span id="s9-number">{number.local}</span>
              </Cta>
              <CopyNumber number={number.intl} targetId="s9-number" />
            </div>
          </div>
          <div className="s9-side">
            <dl className="s9-info">
              <div>
                <dt>Menu</dt>
                <dd>
                  <a href="/menu">The full menu</a>
                </dd>
              </div>
              <div>
                <dt>{text.pickupLabel}</dt>
                <dd>
                  {settings.locationLabel}. {text.pickup}
                </dd>
              </div>
              <div>
                <dt>{text.followLabel}</dt>
                <dd>
                  <a
                    href={instagramUrl(settings.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @{settings.instagram}
                    <span className="sr-only">
                      {' '}
                      on Instagram (opens in a new tab)
                    </span>
                  </a>
                </dd>
              </div>
            </dl>
            <p className="s9-fine">{text.finePrint}</p>
          </div>
        </div>
        <div className="s9-floor" aria-hidden="true">
          <div className="s9-fl">
            <img src="/brand/floor-fire.svg" alt="" width={147} height={116} />
          </div>
          <div className="s9-machine">
            <div data-machine>
              {[...machine, machine[0]].map((word, i) => (
                // The first word repeats at the end (the loop's seam), so words can't be keys.
                // eslint-disable-next-line react/no-array-index-key
                <span key={i}>{word}</span>
              ))}
            </div>
          </div>
          <div className="s9-fl">
            <img src="/brand/floor-box.svg" alt="" width={170} height={117} />
          </div>
        </div>
      </footer>
    </S9Motion>
  );
}
