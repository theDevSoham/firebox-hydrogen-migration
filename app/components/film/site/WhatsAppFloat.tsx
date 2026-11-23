import {WhatsAppGlyph} from '~/components/film/ui/icons';

// The floating WhatsApp button, bottom right on every page but the cart. Switched on and worded
// in Site settings (`whatsapp_float_enabled`, `whatsapp_float_message`); app/root.tsx renders it
// only when it's on. `data-wa-item` reports the click like every other order link
// (WhatsAppTracker). Styles: app/styles/wa-float.css, loaded on every page.

export function WhatsAppFloat({href}: {href: string}) {
  return (
    <a
      className="fb-wa-float"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with The Firebox on WhatsApp (opens in a new tab)"
      data-wa-item="float"
    >
      <WhatsAppGlyph />
    </a>
  );
}
