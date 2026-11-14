// Display rules for the film (firebox-official lib/format.ts, lib/site.ts, lib/whatsapp.ts).

/**
 * Until launch, facts still to come from the client show as their [bracketed] placeholders.
 * At launch, set false: a menu item with no price then reads "Ask on WhatsApp" and a drop hides
 * its price.
 */
export const SHOW_PLACEHOLDERS = true;

export const DEFAULT_ORDER_MESSAGE = "Hi Firebox! I'd like to pre-order.";
export const JOIN_LIST_MESSAGE = 'Hi Firebox! Please add me to the drops list.';

/** Builds a wa.me link with a pre-filled message. Every order action on the site goes through here. */
export function waLink(
  number: string,
  message: string = DEFAULT_ORDER_MESSAGE,
): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** "919830346470" → "98303 46470" (local) and "+91 98303 46470" (international). */
export function displayNumber(number: string): {local: string; intl: string} {
  const digits = number.replace(/\D/g, '');
  const india = digits.length === 12 && digits.startsWith('91');
  const local = india ? digits.slice(2) : digits;
  const spaced =
    local.length === 10 ? `${local.slice(0, 5)} ${local.slice(5)}` : local;
  return {local: spaced, intl: india ? `+91 ${spaced}` : `+${digits}`};
}

export const instagramUrl = (handle: string) =>
  `https://www.instagram.com/${handle}/`;

/** Prices are written 549/- in Anton. Null is a fact still to come from the client. */
export function formatPrice(price: number | null): string | null {
  if (price !== null) return `${Math.round(price)}/-`;
  return SHOW_PLACEHOLDERS ? '[Price]' : null;
}

const DROP_DATE = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Kolkata',
});

/** "Wed 28 Oct" for a YYYY-MM-DD date, read as a day in Kolkata, never the server's. */
export function formatDropDate(date: string | null): string {
  if (!date) return '[Date]';
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? `${date}T12:00:00+05:30`
    : date;
  return DROP_DATE.format(new Date(day)).replace(',', '');
}

export function formatSlot(slot: string): string {
  return slot || '[Slot]';
}

export function formatLimit(limit: number | null): string {
  return `Only ${limit ?? '[N]'}`;
}

/** Fills a WhatsApp message template: {name}, {date}, {slot}, {price}. */
export function renderMessage(
  template: string,
  item: {
    name: string;
    date?: string | null;
    slot?: string;
    price: number | null;
  },
): string {
  return template
    .replaceAll('{name}', item.name)
    .replaceAll('{date}', formatDropDate(item.date ?? null))
    .replaceAll('{slot}', formatSlot(item.slot ?? ''))
    .replaceAll('{price}', formatPrice(item.price) ?? '');
}

/** A multi-line field as its lines, blank ones dropped. */
export function linesOf(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * The one metric that matters: a WhatsApp click, with the item name. Sent to GA4 as
 * `whatsapp_click` once GA is wired up (build order step 4, D.5.2); until then, logged in dev.
 */
export function trackWhatsAppClick(item: string): void {
  // eslint-disable-next-line no-console -- dev-only trace until GA4 is wired up (step 4)
  if (import.meta.env.DEV) console.debug('[analytics] whatsapp_click', {item});
  window.gtag?.('event', 'whatsapp_click', {item});
}
