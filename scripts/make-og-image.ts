// Draws the Open Graph (sharing) image, 1200 × 630: the logo tag and the chip on charcoal, like
// the end of the intro. A port of firebox-official scripts/make-brand-images.ts without Next or
// Cloudinary: satori lays it out, resvg rasterises it, and it's written to public/brand/og.png.
//
//   npm run og:image
//
// The site uses public/brand/og.png when Site settings → Sharing image is empty; to make it
// editable in the admin instead, upload it there (or run the setup script with
// `--images public/brand`). Re-run this when the client's vector logo arrives.

import {readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {Resvg} from '@resvg/resvg-js';
import satori from 'satori';

const require = createRequire(import.meta.url);
const ROOT = resolve(import.meta.dirname, '..');
const C = {charcoal: '#160B06', cream: '#FEF2DA', ember: '#B11E24'}; // tokens, app/styles/tailwind.css
const LOGO_RATIO = 176.6 / 329;
const OUT = resolve(ROOT, 'public/brand/og.png');

const svg = (file: string) =>
  `data:image/svg+xml;base64,${readFileSync(resolve(ROOT, 'public/brand', file)).toString('base64')}`;

// Satori reads TTF, OTF and WOFF, not WOFF2: Yanone Kaffeesatz Bold as WOFF, from @fontsource.
const yanone = readFileSync(
  require.resolve('@fontsource/yanone-kaffeesatz/files/yanone-kaffeesatz-latin-700-normal.woff'),
);

type Node = {type: string; props: Record<string, unknown>};
const h = (
  type: string,
  style: Record<string, unknown>,
  ...children: (Node | string)[]
): Node => ({
  type,
  props: {style, children: children.length === 1 ? children[0] : children},
});
const img = (src: string, width: number, height: number): Node => ({
  type: 'img',
  props: {src, width, height},
});

const tree = h(
  'div',
  {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: C.charcoal,
  },
  h(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 600,
      height: 338,
      background: C.ember,
      transform: 'rotate(-2deg)',
    },
    img(svg('logo-reversed.svg'), 525, Math.round(525 * LOGO_RATIO)),
  ),
  h(
    'div',
    {
      display: 'flex',
      marginTop: 48,
      padding: '12px 24px 8px',
      background: C.ember,
      border: `4px solid ${C.cream}`,
      color: C.cream,
      fontFamily: 'Yanone',
      fontSize: 40,
      letterSpacing: 3,
      textTransform: 'uppercase',
      transform: 'rotate(3deg)',
    },
    'Low & slow · wood smoked',
  ),
);

const markup = await satori(tree as Parameters<typeof satori>[0], {
  width: 1200,
  height: 630,
  fonts: [{name: 'Yanone', data: yanone, weight: 700, style: 'normal'}],
});
const png = new Resvg(markup, {fitTo: {mode: 'width', value: 1200}})
  .render()
  .asPng();
writeFileSync(OUT, png);
console.log(
  `wrote public/brand/og.png (1200 × 630, ${Math.round(png.length / 1024)} KB)`,
);
