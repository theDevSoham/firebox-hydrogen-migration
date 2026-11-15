// The web app manifest, served by a route: Oxygen doesn't serve .webmanifest files from public/.
export function loader() {
  const manifest = {
    name: 'The Firebox',
    short_name: 'The Firebox',
    description:
      "Kolkata's first low & slow, wood smoked barbeque, off a rooftop pit in Mukundapur. Nine hours over wood. Only twenty a drop. Pre-order on WhatsApp.",
    start_url: '/',
    display: 'browser',
    background_color: '#160B06',
    theme_color: '#160B06',
    icons: [
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}
