import type {CSSProperties} from 'react';
import {DishCard} from '~/components/film/cards/DishCard';
import {CartDrawer} from '~/components/film/cart/CartDrawer';
import {CartToast} from '~/components/film/cart/CartToast';
import {CartUiProvider} from '~/components/film/cart/CartUi';
import {InPageLinks} from '~/components/film/site/InPageLinks';
import {SiteNav} from '~/components/film/site/SiteNav';
import {Cta} from '~/components/film/ui/Cta';
import {JOIN_LIST_MESSAGE, waLink} from '~/lib/film/format';
import type {MenuChapter, Settings} from '~/lib/film/model';
import {MenuMotion} from './MenuMotion';

// /menu: the film's menu (S4) without the film, for people who already know what they want.
// Same chapters, same cards and the same cart as the film (PORTING-DECISIONS.md · D.6); motion
// is CSS only (film.css · /menu) plus two IntersectionObservers (./MenuMotion.tsx). Without
// JavaScript it's a complete page: anchors for the chips, the cart page for the cart button.

const longestWord = (title: string) =>
  Math.max(...title.split(/\s+/).map((word) => word.length), 1);

export function MenuPage({
  chapters,
  settings,
}: {
  chapters: MenuChapter[];
  settings: Settings;
}) {
  const nextDropHref =
    settings.broadcastLink ||
    waLink(settings.whatsappNumber, JOIN_LIST_MESSAGE);

  return (
    <CartUiProvider>
      <div className="mn-page">
        <a className="fb-skip" href="#content">
          Skip to content
        </a>
        <InPageLinks />
        <SiteNav home="/" current="menu" />
        <main
          id="content"
          tabIndex={-1}
          className="mn"
          data-theme={chapters[0]?.theme ?? 'night'}
        >
          <header className="mn-head">
            <p className="fb-yanone mn-kicker">{settings.locationLabel}</p>
            <h1 className="fb-anton mn-h">Menu</h1>
          </header>

          {chapters.length > 0 ? (
            <>
              <nav className="mn-chips" aria-label="Menu sections">
                <ul>
                  {chapters.map((chapter) => (
                    <li key={chapter.id}>
                      <a
                        className="fb-yanone mn-chip"
                        href={`#${chapter.id}`}
                        data-chip={chapter.id}
                      >
                        {chapter.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div id="menu" className="mn-sections">
                {chapters.map((chapter) => (
                  <section
                    key={chapter.id}
                    id={chapter.id}
                    className={`mn-section${chapter.theme === 'kraft' ? ' fb-kraft' : ''}`}
                    data-theme={chapter.theme}
                    aria-labelledby={`${chapter.id}-title`}
                    data-mn-section
                  >
                    <h2
                      id={`${chapter.id}-title`}
                      className="fb-anton mn-title"
                      style={
                        {'--chars': longestWord(chapter.title)} as CSSProperties
                      }
                    >
                      <span>{chapter.title}</span>
                    </h2>
                    <div className="mn-cards">
                      {chapter.items.map((item) => (
                        <div key={item.id} className="mn-card" data-mn-card>
                          <DishCard
                            item={item}
                            whatsappNumber={settings.whatsappNumber}
                            nextDropHref={nextDropHref}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          ) : (
            <div className="mn-empty">
              <p className="fb-fraunces">The menu is being written up.</p>
              <Cta href={waLink(settings.whatsappNumber)} item="Menu · Empty">
                Ask on WhatsApp
              </Cta>
            </div>
          )}
        </main>
        <footer className="mn-foot">
          <a className="fb-yanone" href="/">
            The Firebox
          </a>
          <span className="fb-yanone">{settings.locationLabel}</span>
        </footer>
      </div>
      <MenuMotion />
      <CartToast />
      <CartDrawer />
    </CartUiProvider>
  );
}
