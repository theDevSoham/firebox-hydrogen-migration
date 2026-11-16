import type {CSSProperties} from 'react';
import {DishCard} from '~/components/film/cards/DishCard';
import {S4Motion} from '~/components/film/motion/S4Motion';
import type {MenuChapter} from '~/lib/film/model';

// S4 · The cuts. One colour chapter per menu section; the title sticks under the nav
// and the cards pass beneath it like credits.

type S4CutsProps = {
  chapters: MenuChapter[];
  whatsappNumber: string;
  nextDropHref: string;
};

const pad = (n: number) => String(n).padStart(2, '0');

export function S4Cuts({chapters, whatsappNumber, nextDropHref}: S4CutsProps) {
  return (
    <S4Motion>
      <section id="menu" className="s4" data-scene="S4" aria-label="The cuts">
        {chapters.map((section, i) => (
          <div
            key={section.id}
            className={`s4-chapter${section.theme === 'kraft' ? ' fb-kraft' : ''}`}
            data-chapter
            data-theme={section.theme}
          >
            <div
              className="s4-title"
              style={{'--chars': section.title.length} as CSSProperties}
              data-long={section.title.length > 6 ? '' : undefined}
            >
              <h2 className="fb-anton s4-swell">{section.title}</h2>
              <span
                className="fb-yanone s4-count"
                aria-label={`Chapter ${i + 1} of ${chapters.length}`}
              >
                {pad(i + 1)} / {pad(chapters.length)}
              </span>
            </div>
            <div className="s4-spacer" />
            <div className="s4-cards" data-count={section.items.length}>
              {section.items.map((item) => (
                <DishCard
                  key={item.id}
                  item={item}
                  whatsappNumber={whatsappNumber}
                  nextDropHref={nextDropHref}
                />
              ))}
            </div>
          </div>
        ))}
      </section>
    </S4Motion>
  );
}
