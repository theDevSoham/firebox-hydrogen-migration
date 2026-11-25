// Sets up the store for the film (build order step 2): the content model in
// scripts/shopify/schema.ts, then the starting content in scripts/shopify/content.ts.
//
//   npm run shopify:setup -- --dry-run          # show what it would do; changes nothing
//   npm run shopify:setup                       # do it
//   npm run shopify:setup -- --images <folder>  # also upload the images found in <folder>
//                                               (repeat --images to search several folders)
//   npm run shopify:setup -- --publish          # (re)publish the menu to the storefront channel
//   npm run shopify:setup -- --reset <type.field>  # set one field of existing entries back to the
//                                               repo's value, e.g. --reset scene_pit.note (repeatable)
//   npm run shopify:setup -- --overwrite        # reset existing content to the repo's originals
//
// Safe to re-run. Definitions are kept in line with schema.ts. Content (products, collections,
// entries) is only created when missing: anything edited in the Shopify admin is left alone,
// unless --overwrite. The only thing ever deleted is a retired menu section (seed.ts
// RETIRED_SECTIONS), and only once it holds no dishes. Images are opt-in (--images); without them
// the image fields stay empty and the site shows its placeholders.
//
// Credentials come from .env.setup (see .env.setup.example and docs/shopify-access.md).

import {existsSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {
  API_VERSION,
  check,
  createAdmin,
  getAccessToken,
  normalizeShop,
  uploadImage,
  waitForFiles,
  type Admin,
} from './shopify/admin';
import {
  ALL_COLLECTIONS,
  HOME,
  IMAGE_SLOTS,
  PRODUCTS,
  entries,
  productInput,
} from './shopify/content';
import {RETIRED_SECTIONS} from '../app/lib/film/seed';
import {
  ATTACH_FILE,
  COLLECTION_CREATE,
  COLLECTION_DELETE,
  COLLECTION_REORDER,
  DEFINITIONS,
  FIND_COLLECTION,
  FIND_FILE,
  FIND_METAOBJECT,
  FIND_PRODUCT,
  METAFIELD_DEFINITION_CREATE,
  METAFIELD_DEFINITION_UPDATE,
  METAOBJECT_DEFINITION_CREATE,
  METAOBJECT_DEFINITION_UPDATE,
  METAOBJECT_UPSERT,
  PRODUCT_SET,
  PUBLICATIONS,
  PUBLISH,
  SHOP,
} from './shopify/operations';
import {
  METAFIELD_DEFINITIONS,
  METAOBJECT_DEFINITIONS,
  REQUIRED_SCOPES,
  type FieldDef,
  type MetaobjectDef,
} from './shopify/schema';

// ---------- reporting ----------

type Mark = '+' | '~' | '-' | '=' | '!' | '·';
const tally = {created: 0, updated: 0, deleted: 0, unchanged: 0, warnings: 0};
const warnings: string[] = [];

function say(mark: Mark, what: string, note = '') {
  if (mark === '+') tally.created++;
  if (mark === '~') tally.updated++;
  if (mark === '-') tally.deleted++;
  if (mark === '=') tally.unchanged++;
  if (mark === '!') {
    tally.warnings++;
    warnings.push(`${what}${note ? ` ${note}` : ''}`);
  }
  console.log(`  ${mark} ${what}${note ? `  ${note}` : ''}`);
}

const heading = (title: string) => console.log(`\n${title}`);

// ---------- setup ----------

type Options = {
  dryRun: boolean;
  /** Folders searched in order for each image file. */
  images: string[];
  overwrite: boolean;
  publish: boolean;
  /** Entry fields (`type.field`) to set back to the repo's value on entries that already exist. */
  reset: Set<string>;
};

/** Offline (no credentials) or a live store. Offline, everything reads as missing. */
type Store = {admin: Admin | null; write: boolean};

async function main() {
  const {values} = parseArgs({
    options: {
      'dry-run': {type: 'boolean', default: false},
      images: {type: 'string', multiple: true},
      overwrite: {type: 'boolean', default: false},
      publish: {type: 'boolean', default: false},
      reset: {type: 'string', multiple: true},
      help: {type: 'boolean', short: 'h', default: false},
    },
  });
  if (values.help) {
    console.log(readUsage());
    return;
  }
  const options: Options = {
    dryRun: values['dry-run'],
    images: (values.images ?? []).map((folder) => resolve(folder)),
    overwrite: values.overwrite,
    publish: values.publish,
    reset: new Set(values.reset ?? []),
  };
  for (const folder of options.images) {
    if (!existsSync(folder))
      throw new Error(`--images folder not found: ${folder}`);
  }

  if (existsSync('.env.setup')) process.loadEnvFile('.env.setup');
  const {SHOPIFY_STORE, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET} = process.env;
  const haveCredentials = Boolean(
    SHOPIFY_STORE && SHOPIFY_CLIENT_ID && SHOPIFY_CLIENT_SECRET,
  );

  let store: Store;
  if (!haveCredentials) {
    if (!options.dryRun) {
      throw new Error(
        'Missing SHOPIFY_STORE, SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET. Copy .env.setup.example to .env.setup and fill it in (docs/shopify-access.md), or run with --dry-run to preview offline.',
      );
    }
    console.log(
      'Dry run, offline (no credentials in .env.setup): showing everything as new.',
    );
    store = {admin: null, write: false};
  } else {
    const shop = normalizeShop(SHOPIFY_STORE!);
    const {token, scopes} = await getAccessToken(
      shop,
      SHOPIFY_CLIENT_ID!,
      SHOPIFY_CLIENT_SECRET!,
    );
    const admin = createAdmin(shop, token);
    const {shop: info} = await admin.query<{
      shop: {name: string; myshopifyDomain: string; currencyCode: string};
    }>(SHOP);
    console.log(
      `${options.dryRun ? 'Dry run against' : 'Setting up'} ${info.name} (${info.myshopifyDomain}), Admin API ${API_VERSION}.`,
    );
    const missing = REQUIRED_SCOPES.filter((s) => !scopes.includes(s));
    if (missing.length) {
      throw new Error(
        `The app is missing access scopes: ${missing.join(', ')}. Add them in a new app version in the Dev Dashboard, release it, and approve it on the store (docs/shopify-access.md).`,
      );
    }
    if (info.currencyCode !== 'INR') {
      say(
        '!',
        `Store currency is ${info.currencyCode}, not INR.`,
        'Prices are entered in the store currency; change it in Settings → Store details.',
      );
    }
    store = {admin, write: !options.dryRun};
  }

  await syncDefinitions(store);
  const images = await syncImages(store, options);
  const collectionIds = await syncCollections(store);
  const {created: newProducts, ids: productIds} = await syncProducts(
    store,
    options,
    collectionIds.ids,
    images,
  );
  await reorderNewCollections(store, collectionIds, productIds);
  await deleteRetiredCollections(store);
  await publishMenu(store, options, collectionIds, newProducts);
  await syncEntries(store, options, images, collectionIds.ids);

  heading(store.write ? 'Done.' : 'Dry run: nothing was changed.');
  const verb = store.write ? '' : ' (would be)';
  console.log(
    `  ${tally.created} created${verb} · ${tally.updated} updated${verb} · ${tally.deleted} deleted${verb} · ${tally.unchanged} already there · ${tally.warnings} warning(s)`,
  );
  for (const w of warnings) console.log(`  ! ${w}`);
}

// ---------- 1. definitions ----------

type DefinitionsResult = {
  productDefs: {nodes: {id: string; key: string; type: {name: string}}[]};
  collectionDefs: {nodes: {id: string; key: string; type: {name: string}}[]};
  metaobjectDefinitions: {
    nodes: {
      id: string;
      type: string;
      fieldDefinitions: {key: string; type: {name: string}}[];
    }[];
  };
};

function fieldInput(field: FieldDef, definitionIds: Map<string, string>) {
  const validations = [...(field.validations ?? [])];
  if (field.references) {
    const id =
      definitionIds.get(field.references) ??
      `(new ${field.references} definition)`;
    validations.push({name: 'metaobject_definition_id', value: id});
  }
  return {
    key: field.key,
    name: field.name,
    description: field.description ?? '',
    required: field.required ?? false,
    validations,
  };
}

async function syncDefinitions(store: Store): Promise<Map<string, string>> {
  heading('Content model (PORTING-DECISIONS.md · B)');
  const existing: DefinitionsResult = store.admin
    ? await store.admin.query<DefinitionsResult>(DEFINITIONS)
    : {
        productDefs: {nodes: []},
        collectionDefs: {nodes: []},
        metaobjectDefinitions: {nodes: []},
      };

  for (const def of METAFIELD_DEFINITIONS) {
    const label = `${def.ownerType.toLowerCase()} field firebox.${def.key}`;
    const found = (
      def.ownerType === 'PRODUCT'
        ? existing.productDefs
        : existing.collectionDefs
    ).nodes.find((d) => d.key === def.key);
    const shared = {
      name: def.name,
      description: def.description ?? '',
      validations: def.validations ?? [],
      access: {storefront: 'PUBLIC_READ'},
    };
    if (!found) {
      say('+', label);
      if (store.write) {
        const r = await store.admin!.query<{
          metafieldDefinitionCreate: {userErrors: []};
        }>(METAFIELD_DEFINITION_CREATE, {
          definition: {
            ...shared,
            namespace: def.namespace,
            key: def.key,
            type: def.type,
            ownerType: def.ownerType,
            pin: true,
          },
        });
        check(`Create ${label}`, r.metafieldDefinitionCreate.userErrors);
      }
    } else if (found.type.name !== def.type) {
      say(
        '!',
        label,
        `is ${found.type.name} in the store, ${def.type} in schema.ts: Shopify can't change a field's type. Left as is.`,
      );
    } else {
      say('~', label, '(name, help text, limits)');
      if (store.write) {
        const r = await store.admin!.query<{
          metafieldDefinitionUpdate: {userErrors: []};
        }>(METAFIELD_DEFINITION_UPDATE, {
          definition: {
            ...shared,
            namespace: def.namespace,
            key: def.key,
            ownerType: def.ownerType,
          },
        });
        check(`Update ${label}`, r.metafieldDefinitionUpdate.userErrors);
      }
    }
  }

  const ids = new Map(
    existing.metaobjectDefinitions.nodes.map((d) => [d.type, d.id]),
  );
  for (const def of METAOBJECT_DEFINITIONS) {
    const found = existing.metaobjectDefinitions.nodes.find(
      (d) => d.type === def.type,
    );
    if (!found) {
      say(
        '+',
        `type ${def.type}`,
        `"${def.name}", ${def.fields.length} fields`,
      );
      if (store.write) {
        const r = await store.admin!.query<{
          metaobjectDefinitionCreate: {
            metaobjectDefinition: {id: string} | null;
            userErrors: [];
          };
        }>(METAOBJECT_DEFINITION_CREATE, {
          definition: {
            ...definitionShared(def),
            type: def.type,
            fieldDefinitions: def.fields.map((f) => ({
              ...fieldInput(f, ids),
              type: f.type,
            })),
          },
        });
        check(
          `Create type ${def.type}`,
          r.metaobjectDefinitionCreate.userErrors,
        );
        ids.set(
          def.type,
          r.metaobjectDefinitionCreate.metaobjectDefinition!.id,
        );
      }
      continue;
    }
    const have = new Map(
      found.fieldDefinitions.map((f) => [f.key, f.type.name]),
    );
    const added = def.fields.filter((f) => !have.has(f.key));
    for (const f of def.fields) {
      if (have.has(f.key) && have.get(f.key) !== f.type) {
        say(
          '!',
          `${def.type}.${f.key}`,
          `is ${have.get(f.key)} in the store, ${f.type} in schema.ts: Shopify can't change a field's type. Left as is.`,
        );
      }
    }
    const extra = [...have.keys()].filter(
      (key) => !def.fields.some((f) => f.key === key),
    );
    say(
      '~',
      `type ${def.type}`,
      added.length
        ? `(adds ${added.map((f) => f.key).join(', ')})`
        : '(names, help text, limits)',
    );
    if (extra.length)
      say(
        '·',
        `${def.type} also has ${extra.join(', ')}`,
        '(not in schema.ts; left alone)',
      );
    if (store.write) {
      const fieldDefinitions = def.fields
        .filter((f) => !have.has(f.key) || have.get(f.key) === f.type)
        .map((f) =>
          have.has(f.key)
            ? {update: fieldInput(f, ids)}
            : {create: {...fieldInput(f, ids), type: f.type}},
        );
      const r = await store.admin!.query<{
        metaobjectDefinitionUpdate: {userErrors: []};
      }>(METAOBJECT_DEFINITION_UPDATE, {
        id: found.id,
        definition: {...definitionShared(def), fieldDefinitions},
      });
      check(`Update type ${def.type}`, r.metaobjectDefinitionUpdate.userErrors);
    }
  }
  return ids;
}

function definitionShared(def: MetaobjectDef) {
  return {
    name: def.name,
    description: def.description,
    ...(def.displayNameKey ? {displayNameKey: def.displayNameKey} : {}),
    access: {storefront: 'PUBLIC_READ'},
    ...(def.publishable ? {capabilities: {publishable: {enabled: true}}} : {}),
  };
}

// ---------- 2. images (opt-in) ----------

type Images = Map<string, string>; // slot → MediaImage id

async function syncImages(store: Store, options: Options): Promise<Images> {
  const bySlot: Images = new Map();
  if (!options.images.length) {
    heading(
      'Images: not checked this run (images already in the store stay; add --images <folder> to upload new ones)',
    );
    return bySlot;
  }
  heading(`Images from ${options.images.join(', ')}`);
  const byFile = new Map<string, string>();
  const uploaded: string[] = [];
  const files = [...new Map(IMAGE_SLOTS.map((s) => [s.file, s])).values()];

  for (const {file} of files) {
    const path = options.images
      .map((folder) => join(folder, file))
      .find((p) => existsSync(p));
    if (!path) {
      say(
        '·',
        file,
        'not in the folder(s); store images for its slots are kept',
      );
      continue;
    }
    // The alt text of the first slot that has one (Shopify keeps alt text on the file).
    const alt = IMAGE_SLOTS.find((s) => s.file === file && s.alt)?.alt ?? '';
    const found = store.admin
      ? (
          await store.admin.query<{files: {nodes: {id: string}[]}}>(FIND_FILE, {
            query: `filename:${JSON.stringify(file)}`,
          })
        ).files.nodes[0]
      : undefined;
    if (found) {
      say('=', file);
      byFile.set(file, found.id);
    } else {
      say(
        '+',
        file,
        alt
          ? `alt: "${alt.slice(0, 50)}${alt.length > 50 ? '…' : ''}"`
          : '(decorative)',
      );
      if (store.write) {
        const id = await uploadImage(store.admin!, path, alt);
        uploaded.push(id);
        byFile.set(file, id);
      } else {
        byFile.set(file, `(new file ${file})`);
      }
    }
  }
  if (uploaded.length) {
    console.log(
      `  · waiting for Shopify to process ${uploaded.length} upload(s)…`,
    );
    await waitForFiles(store.admin!, uploaded);
  }
  for (const s of IMAGE_SLOTS) {
    const id = byFile.get(s.file);
    if (id) bySlot.set(s.slot, id);
  }
  return bySlot;
}

// ---------- 3. collections and products ----------

type CollectionIds = {ids: Map<string, string>; created: Set<string>};

async function syncCollections(store: Store): Promise<CollectionIds> {
  heading('Menu chapters and Home page (collections)');
  const ids = new Map<string, string>();
  const created = new Set<string>();
  for (const c of ALL_COLLECTIONS) {
    const found = store.admin
      ? (
          await store.admin.query<{
            collectionByIdentifier: {id: string} | null;
          }>(FIND_COLLECTION, {handle: c.handle})
        ).collectionByIdentifier
      : null;
    if (found) {
      say('=', `${c.handle}`, `"${c.title}"`);
      ids.set(c.handle, found.id);
      continue;
    }
    say('+', `${c.handle}`, `"${c.title}"`);
    created.add(c.handle);
    if (store.write) {
      const r = await store.admin!.query<{
        collectionCreate: {collection: {id: string} | null; userErrors: []};
      }>(COLLECTION_CREATE, {
        collection: {
          title: c.title,
          handle: c.handle,
          sortOrder: 'MANUAL',
        },
      });
      check(`Create collection ${c.handle}`, r.collectionCreate.userErrors);
      ids.set(c.handle, r.collectionCreate.collection!.id);
    } else {
      ids.set(c.handle, `(new collection ${c.handle})`);
    }
  }
  return {ids, created};
}

async function syncProducts(
  store: Store,
  options: Options,
  collectionIds: Map<string, string>,
  images: Images,
) {
  heading('Dishes (products)');
  const ids = new Map<string, string>();
  const created = new Set<string>();
  for (const p of PRODUCTS) {
    const found = store.admin
      ? (
          await store.admin.query<{
            productByIdentifier: {
              id: string;
              media: {nodes: {id: string}[]};
            } | null;
          }>(FIND_PRODUCT, {handle: p.handle})
        ).productByIdentifier
      : null;
    const imageId = images.get(`product:${p.handle}`);
    const price = p.price == null ? 'price to confirm (0)' : `${p.price}/-`;

    if (found && !options.overwrite) {
      ids.set(p.handle, found.id);
      if (imageId && !found.media.nodes.length) {
        say('~', p.handle, 'adds its image');
        if (store.write) {
          const r = await store.admin!.query<{fileUpdate: {userErrors: []}}>(
            ATTACH_FILE,
            {
              files: [{id: imageId, referencesToAdd: [found.id]}],
            },
          );
          check(`Attach image to ${p.handle}`, r.fileUpdate.userErrors);
        }
      } else {
        say('=', p.handle, `"${p.title}"`);
      }
      continue;
    }

    say(
      found ? '~' : '+',
      p.handle,
      `"${p.title}", ${price}, in ${p.collection}${found ? ' (overwrite)' : ''}`,
    );
    if (!found) created.add(p.handle);
    if (store.write) {
      // Its menu section, plus Home page when the seed marks it for the film.
      const inCollections = [
        collectionIds.get(p.collection),
        p.home ? collectionIds.get(HOME.handle) : undefined,
      ].filter((id): id is string => Boolean(id));
      const r = await store.admin!.query<{
        productSet: {product: {id: string} | null; userErrors: []};
      }>(PRODUCT_SET, {
        identifier: {handle: p.handle},
        input: productInput(p, {
          collectionIds: inCollections,
          imageId: found?.media.nodes.length ? undefined : imageId,
        }),
      });
      check(`Save product ${p.handle}`, r.productSet.userErrors);
      ids.set(p.handle, r.productSet.product!.id);
    } else {
      ids.set(p.handle, found?.id ?? `(new product ${p.handle})`);
    }
  }
  return {created, ids};
}

/** New collections get their dishes in seed order; existing ones keep the admin's order. */
async function reorderNewCollections(
  store: Store,
  collections: CollectionIds,
  productIds: Map<string, string>,
) {
  if (!store.write) return;
  for (const c of ALL_COLLECTIONS) {
    if (!collections.created.has(c.handle) || !c.productHandles.length)
      continue;
    const moves = c.productHandles
      .map((handle, i) => ({
        id: productIds.get(handle),
        newPosition: String(i),
      }))
      .filter((m): m is {id: string; newPosition: string} => Boolean(m.id));
    const r = await store.admin!.query<{
      collectionReorderProducts: {userErrors: []};
    }>(COLLECTION_REORDER, {
      id: collections.ids.get(c.handle),
      moves,
    });
    check(
      `Order dishes in ${c.handle}`,
      r.collectionReorderProducts.userErrors,
    );
  }
}

/**
 * Deletes the menu sections the seed has retired (RETIRED_SECTIONS). The one thing this script
 * deletes, and only a collection that holds no products: one that still has dishes is left alone
 * with a warning, so move them to another section first. Deleting can't be undone.
 */
async function deleteRetiredCollections(store: Store) {
  if (!RETIRED_SECTIONS.length || !store.admin) return;
  heading('Retired menu chapters (collections)');
  for (const handle of RETIRED_SECTIONS) {
    const found = (
      await store.admin.query<{
        collectionByIdentifier: {
          id: string;
          productsCount: {count: number} | null;
        } | null;
      }>(FIND_COLLECTION, {handle})
    ).collectionByIdentifier;
    if (!found) {
      say('=', handle, '(already gone)');
      continue;
    }
    const count = found.productsCount?.count ?? 0;
    if (count > 0) {
      say(
        '!',
        `${handle} still has ${count} dish(es), so it was not deleted.`,
        'Move them to another section, then run again.',
      );
      continue;
    }
    say('-', handle, 'empty, so deleted from the store (cannot be undone)');
    if (store.write) {
      const r = await store.admin.query<{collectionDelete: {userErrors: []}}>(
        COLLECTION_DELETE,
        {id: found.id},
      );
      check(`Delete collection ${handle}`, r.collectionDelete.userErrors);
    }
  }
}

// ---------- 4. publishing to the storefront ----------

/**
 * The storefront only sees products and collections published to its sales channel (Hydrogen, or
 * Headless). New ones are published on creation; --publish publishes all of the menu's (use it
 * once after installing the channel). A dish unpublished in the admin (B.1 "hidden") is never
 * republished without --publish.
 */
async function publishMenu(
  store: Store,
  options: Options,
  collections: CollectionIds,
  newProducts: Set<string>,
) {
  heading('Storefront channel');
  const targets: {label: string; id?: string; productHandle?: string}[] = [
    ...ALL_COLLECTIONS.filter(
      (c) => options.publish || collections.created.has(c.handle),
    ).map((c) => ({
      label: `collection ${c.handle}`,
      id: collections.ids.get(c.handle),
    })),
    ...PRODUCTS.filter((p) => options.publish || newProducts.has(p.handle)).map(
      (p) => ({
        label: p.handle,
        productHandle: p.handle,
      }),
    ),
  ];
  if (!targets.length) {
    say(
      '=',
      'Nothing new to publish',
      '(run with --publish to publish the whole menu again)',
    );
    return;
  }
  if (!store.admin) {
    say(
      '+',
      `Publish ${targets.length} collections and dishes to the Hydrogen channel`,
      '(if it is installed)',
    );
    return;
  }
  const {publications} = await store.admin.query<{
    publications: {
      nodes: {
        id: string;
        catalog: {title: string; apps?: {nodes: {title: string}[]}} | null;
      }[];
    };
  }>(PUBLICATIONS);
  // A storefront's catalog belongs to the Hydrogen (or Headless) app; its title only carries the
  // storefront's name, so match on the app. Every such storefront gets the menu.
  const channels = publications.nodes.filter((p) =>
    p.catalog?.apps?.nodes.some((app) =>
      /^(hydrogen|headless)$/i.test(app.title),
    ),
  );
  if (!channels.length) {
    say(
      '!',
      'No Hydrogen storefront to publish to yet.',
      'Install the Hydrogen channel and create a storefront in it (or run `npx shopify hydrogen link`), then run again with --publish (docs/shopify-access.md).',
    );
    return;
  }
  const names = channels
    .map(
      (c) =>
        `"${c.catalog?.title.replace(/^Channel Catalog \d+ for /, '') ?? c.id}"`,
    )
    .join(', ');
  say('+', `Publish ${targets.length} collections and dishes to ${names}`);
  if (!store.write) return;
  for (const t of targets) {
    const id =
      t.id ??
      (
        await store.admin.query<{productByIdentifier: {id: string} | null}>(
          FIND_PRODUCT,
          {handle: t.productHandle},
        )
      ).productByIdentifier?.id;
    if (!id) continue;
    const r = await store.admin.query<{publishablePublish: {userErrors: []}}>(
      PUBLISH,
      {id, input: channels.map((c) => ({publicationId: c.id}))},
    );
    check(`Publish ${t.label}`, r.publishablePublish.userErrors);
  }
}

// ---------- 5. entries ----------

async function syncEntries(
  store: Store,
  options: Options,
  images: Images,
  collectionIds: Map<string, string>,
) {
  heading('Page content, drops, reels and comments (entries)');
  const metaobjectIds = new Map<string, string>();
  const imageKeys = new Set(
    METAOBJECT_DEFINITIONS.flatMap((d) =>
      d.fields
        .filter((f) => f.type === 'file_reference')
        .map((f) => `${d.type}.${f.key}`),
    ),
  );

  const refs = {
    image: (slot: string) => images.get(slot),
    metaobject: (type: string, handle: string) =>
      metaobjectIds.get(`${type}/${handle}`),
    collection: (handle: string) => collectionIds.get(handle),
  };
  const count = entries(refs).length;

  for (let i = 0; i < count; i++) {
    // Rebuilt each time, so an entry sees the ids of the entries saved before it
    // (scene_kolkata points at the reels and comments, site_settings at the collections).
    const entry = entries(refs)[i];
    const label = `${entry.type}/${entry.handle}`;
    const found = store.admin
      ? (
          await store.admin.query<{
            metaobjectByHandle: {
              id: string;
              fields: {key: string; value: string | null}[];
            } | null;
          }>(FIND_METAOBJECT, {
            handle: {type: entry.type, handle: entry.handle},
          })
        ).metaobjectByHandle
      : null;

    let fields = entry.fields;
    if (found && !options.overwrite) {
      // Only fill image fields that are still empty; never touch edited text, except a field
      // named with --reset, which goes back to the repo's value when it differs.
      const now = new Map(found.fields.map((f) => [f.key, f.value]));
      fields = entry.fields.filter(
        (f) =>
          (imageKeys.has(`${entry.type}.${f.key}`) && !now.get(f.key)) ||
          (options.reset.has(`${entry.type}.${f.key}`) &&
            !sameValue(f.value, now.get(f.key))),
      );
      metaobjectIds.set(label, found.id);
      if (!fields.length) {
        say('=', label);
        continue;
      }
      say('~', label, `sets ${fields.map((f) => f.key).join(', ')}`);
    } else {
      say(
        found ? '~' : '+',
        label,
        found ? '(overwrite)' : `${entry.fields.length} fields`,
      );
    }

    if (store.write) {
      const r = await store.admin!.query<{
        metaobjectUpsert: {metaobject: {id: string} | null; userErrors: []};
      }>(METAOBJECT_UPSERT, {
        handle: {type: entry.type, handle: entry.handle},
        metaobject: {
          fields,
          ...(entry.publish && (!found || options.overwrite)
            ? {capabilities: {publishable: {status: entry.publish}}}
            : {}),
        },
      });
      check(`Save ${label}`, r.metaobjectUpsert.userErrors);
      metaobjectIds.set(label, r.metaobjectUpsert.metaobject!.id);
    } else if (!found) {
      metaobjectIds.set(label, `(new ${label})`);
    }
  }
}

/** Whether two field values are the same; lists (stored as JSON) compare item by item. */
function sameValue(a: string, b: string | null | undefined) {
  const tidy = (v: string) => {
    try {
      return JSON.stringify(JSON.parse(v));
    } catch {
      return v;
    }
  };
  return tidy(a) === tidy(b ?? '');
}

function readUsage() {
  return `Usage: npm run shopify:setup -- [--dry-run] [--images <folder>] [--publish] [--reset <type.field>] [--overwrite]

  --dry-run          Show what would change. Without credentials, works offline.
  --images <folder>  Upload the images in <folder> (filenames as listed in
                     scripts/shopify/content.ts) and fill empty image fields.
                     Repeat it to search several folders, first match wins.
  --publish          Publish the whole menu to the Hydrogen channel.
  --reset <t.field>  Set one field of existing entries back to the repo's value,
                     e.g. --reset site_settings.menu_sections. Repeatable.
  --overwrite        Reset existing products and entries to the repo's originals.

Credentials: .env.setup (see .env.setup.example and docs/shopify-access.md).`;
}

main().catch((error: unknown) => {
  console.error(
    `\n✖ ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
