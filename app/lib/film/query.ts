// The one query the film runs (PORTING-DECISIONS.md · C): every scene_* entry, site_settings
// with its menu collections and their products, and the drops. Field keys are the ones in
// section B; ./model.ts maps the result to the scenes' props.

export const FILM_QUERY = `#graphql
  fragment FilmImage on Image {
    url
    width
    height
    altText
  }

  fragment FilmFile on MetaobjectField {
    reference {
      __typename
      ... on MediaImage {
        image {
          ...FilmImage
        }
      }
      ... on Video {
        sources {
          url
          mimeType
          width
          height
        }
        previewImage {
          ...FilmImage
        }
      }
    }
  }

  fragment FilmProduct on Product {
    id
    handle
    title
    description
    availableForSale
    featuredImage {
      ...FilmImage
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    unit: metafield(namespace: "firebox", key: "unit") {
      value
    }
    isNew: metafield(namespace: "firebox", key: "is_new") {
      value
    }
    whatsappMessage: metafield(namespace: "firebox", key: "whatsapp_message") {
      value
    }
  }

  fragment FilmCollection on Collection {
    id
    handle
    title
    theme: metafield(namespace: "firebox", key: "theme") {
      value
    }
    products(first: 50, sortKey: MANUAL) {
      nodes {
        ...FilmProduct
      }
    }
  }

  fragment FilmDrop on Metaobject {
    handle
    kind: field(key: "kind") { value }
    name: field(key: "name") { value }
    description: field(key: "description") { value }
    price: field(key: "price") { value }
    limit: field(key: "limit") { value }
    date: field(key: "date") { value }
    slot: field(key: "slot") { value }
    status: field(key: "status") { value }
    is_new: field(key: "is_new") { value }
    poster: field(key: "poster") { ...FilmFile }
    whatsapp_message: field(key: "whatsapp_message") { value }
    guest_name: field(key: "guest_name") { value }
    guest_url: field(key: "guest_url") { value }
    guest_accent: field(key: "guest_accent") { value }
    sort_order: field(key: "sort_order") { value }
  }

  fragment FilmReel on Metaobject {
    handle
    cover: field(key: "cover") { ...FilmFile }
    video: field(key: "video") { ...FilmFile }
    caption: field(key: "caption") { value }
    likes: field(key: "likes") { value }
    subject: field(key: "subject") { value }
    instagram_url: field(key: "instagram_url") { value }
  }

  fragment FilmComment on Metaobject {
    handle
    quote: field(key: "quote") { value }
    by: field(key: "by") { value }
    cleared: field(key: "cleared") { value }
  }

  query Film($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    settings: metaobject(handle: {type: "site_settings", handle: "site"}) {
      whatsapp_number: field(key: "whatsapp_number") { value }
      location_label: field(key: "location_label") { value }
      broadcast_link: field(key: "broadcast_link") { value }
      instagram: field(key: "instagram") { value }
      menu_sections: field(key: "menu_sections") {
        references(first: 20) {
          nodes {
            ... on Collection {
              ...FilmCollection
            }
          }
        }
      }
      og_image: field(key: "og_image") { ...FilmFile }
      seo_title: field(key: "seo_title") { value }
      seo_description: field(key: "seo_description") { value }
    }

    pit: metaobject(handle: {type: "scene_pit", handle: "home"}) {
      headline: field(key: "headline") { value }
      sub: field(key: "sub") { value }
      cta: field(key: "cta") { value }
      note: field(key: "note") { value }
      art: field(key: "art") { ...FilmFile }
      art_phone: field(key: "art_phone") { ...FilmFile }
      smoke: field(key: "smoke") { ...FilmFile }
    }

    manifesto: metaobject(handle: {type: "scene_manifesto", handle: "home"}) {
      text: field(key: "text") { value }
      chip: field(key: "chip") { value }
    }

    nineHours: metaobject(handle: {type: "scene_nine_hours", handle: "home"}) {
      kicker: field(key: "kicker") { value }
      name: field(key: "name") { value }
      chip: field(key: "chip") { value }
      raw: field(key: "raw") { ...FilmFile }
      done: field(key: "done") { ...FilmFile }
    }

    box: metaobject(handle: {type: "scene_box", handle: "home"}) {
      scrawl: field(key: "scrawl") { value }
      line: field(key: "line") { value }
      sub: field(key: "sub") { value }
      open: field(key: "open") { ...FilmFile }
      closed: field(key: "closed") { ...FilmFile }
    }

    dropsHeading: metaobject(handle: {type: "scene_drops_heading", handle: "home"}) {
      title: field(key: "title") { value }
      sub: field(key: "sub") { value }
    }

    kolkata: metaobject(handle: {type: "scene_kolkata", handle: "home"}) {
      word_1: field(key: "word_1") { value }
      word_2: field(key: "word_2") { value }
      word_3: field(key: "word_3") { value }
      meaning: field(key: "meaning") { value }
      reels: field(key: "reels") {
        references(first: 12) {
          nodes {
            ... on Metaobject {
              ...FilmReel
            }
          }
        }
      }
      comments: field(key: "comments") {
        references(first: 12) {
          nodes {
            ... on Metaobject {
              ...FilmComment
            }
          }
        }
      }
    }

    behind: metaobject(handle: {type: "scene_behind", handle: "home"}) {
      title: field(key: "title") { value }
      byline: field(key: "byline") { value }
      story: field(key: "story") { value }
      link_text: field(key: "link_text") { value }
      photo: field(key: "photo") { ...FilmFile }
    }

    footer: metaobject(handle: {type: "scene_footer", handle: "home"}) {
      headline: field(key: "headline") { value }
      highlight: field(key: "highlight") { value }
      pickup_label: field(key: "pickup_label") { value }
      pickup: field(key: "pickup") { value }
      follow_label: field(key: "follow_label") { value }
      fine_print: field(key: "fine_print") { value }
      rolling_words: field(key: "rolling_words") { value }
      background: field(key: "background") { ...FilmFile }
      smoke: field(key: "smoke") { ...FilmFile }
    }

    drops: metaobjects(type: "drop", first: 50) {
      nodes {
        ...FilmDrop
      }
    }
  }
` as const;
