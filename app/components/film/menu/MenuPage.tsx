import type {CSSProperties} from 'react';
import {DishCard} from '~/components/film/cards/DishCard';
import {CartDrawer} from '~/components/film/cart/CartDrawer';
import {CartToast} from '~/components/film/cart/CartToast';
import {CartUiProvider} from '~/components/film/cart/CartUi';
import {InPageLinks} from '~/components/film/site/InPageLinks';
import {SiteNav} from '~/components/film/site/SiteNav';
import {Cta} from '~/components/film/ui/Cta';
import {JOIN_LIST_MESSAGE, waLink} from '~/lib/film/format';
import type {MenuCategory, MenuItem, Settings} from '~/lib/film/model';
import {MenuMotion} from './MenuMotion';

// /menu: the film's menu (S4) without the film, for people who already know what they want.
// The top level (Chicken, Pork, Buff) gets the sticky chips and the big titles; the
// sub-collections under each (Belly, Ribs…) get a heading each and a row of links under the
// title. Same cards and the same cart as the film (PORTING-DECISIONS.md · D.6); motion
// is CSS only (film.css · /menu) plus two IntersectionObservers (./MenuMotion.tsx). Without
// JavaScript it's a complete page: anchors for the chips, the cart page for the cart button.

const longestWord = (title: string) =>
  Math.max(...title.split(/\s+/).map((word) => word.length), 1);

function Cards({
  items,
  settings,
  nextDropHref,
}: {
  items: MenuItem[];
  settings: Settings;
  nextDropHref: string;
}) {
  return (
    <div className="mn-cards">
      {items.map((item) => (
        <div key={item.id} className="mn-card" data-mn-card>
          <DishCard
            item={item}
            whatsappNumber={settings.whatsappNumber}
            nextDropHref={nextDropHref}
          />
        </div>
      ))}
    </div>
  );
}

export function MenuPage({
  categories,
  settings,
}: {
  categories: MenuCategory[];
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
        <SiteNav home="/" />
        <main
          id="content"
          tabIndex={-1}
          className="mn"
          data-theme={categories[0]?.theme ?? 'night'}
        >
          <header className="mn-head">
            <p className="fb-yanone mn-kicker">{settings.locationLabel}</p>
            <h1 className="fb-anton mn-h">Menu</h1>
          </header>

          {categories.length > 0 ? (
            <>
              <nav className="mn-chips" aria-label="Menu sections">
                <ul>
                  {categories.map((category) => (
                    <li key={category.id}>
                      <a
                        className="fb-yanone mn-chip"
                        href={`#${category.id}`}
                        data-chip={category.id}
                      >
                        {category.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div id="menu" className="mn-sections">
                {categories.map((category) => (
                  <section
                    key={category.id}
                    id={category.id}
                    className={`mn-section${category.theme === 'kraft' ? ' fb-kraft' : ''}`}
                    data-theme={category.theme}
                    aria-labelledby={`${category.id}-title`}
                    data-mn-section
                  >
                    <h2
                      id={`${category.id}-title`}
                      className="fb-anton mn-title"
                      style={
                        {
                          '--chars': longestWord(category.title),
                        } as CSSProperties
                      }
                    >
                      <span>{category.title}</span>
                    </h2>
                    {category.nested ? (
                      <>
                        {category.chapters.length > 1 && (
                          <nav
                            className="mn-subs"
                            aria-label={`${category.title}: sections`}
                          >
                            <ul>
                              {category.chapters.map((chapter) => (
                                <li key={chapter.id}>
                                  <a
                                    className="fb-yanone mn-sub-link"
                                    href={`#${chapter.id}`}
                                  >
                                    {chapter.title}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </nav>
                        )}
                        {category.chapters.map((chapter) => (
                          <section
                            key={chapter.id}
                            id={chapter.id}
                            className="mn-sub"
                            aria-labelledby={`${chapter.id}-title`}
                          >
                            <h3
                              id={`${chapter.id}-title`}
                              className="fb-anton mn-sub-title"
                              data-mn-rise
                            >
                              {chapter.title}
                            </h3>
                            <Cards
                              items={chapter.items}
                              settings={settings}
                              nextDropHref={nextDropHref}
                            />
                          </section>
                        ))}
                      </>
                    ) : (
                      <Cards
                        items={category.chapters[0].items}
                        settings={settings}
                        nextDropHref={nextDropHref}
                      />
                    )}
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
