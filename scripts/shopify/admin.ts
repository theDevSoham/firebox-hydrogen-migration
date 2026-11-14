// A small GraphQL Admin API client for scripts/shopify-setup.ts.
//
// Auth: an app created in the Shopify Dev Dashboard and installed on the store, using the client
// credentials grant: the app's client ID and secret are exchanged for an access token that lasts
// 24 hours, fetched fresh on every run. Shopify no longer lets you create the old admin
// "custom apps" that showed a token. See docs/shopify-access.md.

import {readFile, stat} from 'node:fs/promises';
import {basename} from 'node:path';

export const API_VERSION = '2026-10';

export type Admin = {
  shop: string;
  query: <T>(
    operation: string,
    variables?: Record<string, unknown>,
  ) => Promise<T>;
};

/** "firebox", "firebox.myshopify.com" or "https://firebox.myshopify.com/" → "firebox.myshopify.com". */
export function normalizeShop(input: string): string {
  const host = input
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
  const shop = host.endsWith('.myshopify.com') ? host : `${host}.myshopify.com`;
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop)) {
    throw new Error(
      `SHOPIFY_STORE must be the store's myshopify.com address (e.g. firebox-kolkata.myshopify.com), not "${input}".`,
    );
  }
  return shop;
}

/** The client credentials grant: client ID + secret → a 24-hour Admin API token. */
export async function getAccessToken(
  shop: string,
  clientId: string,
  clientSecret: string,
): Promise<{token: string; scopes: string[]}> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    const hint = text.includes('shop_not_permitted')
      ? '\nThe app and the store must be in the same Shopify organization (docs/shopify-access.md, "Troubleshooting").'
      : text.includes('app_not_installed')
        ? `\nThe credentials are right, but the app isn't installed on ${shop}. In the Dev Dashboard, open the app, choose "Install app", pick this store and approve (docs/shopify-access.md, step 5).`
        : response.status === 400 || response.status === 401
          ? '\nCheck SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET, and that the app is installed on this store.'
          : '';
    throw new Error(
      `Could not get an access token from ${shop} (HTTP ${response.status}): ${text.slice(0, 300)}${hint}`,
    );
  }
  const body = JSON.parse(text) as {access_token: string; scope?: string};
  return {
    token: body.access_token,
    scopes: (body.scope ?? '').split(',').filter(Boolean),
  };
}

type GraphQLResponse<T> = {
  data?: T;
  errors?: {message: string; extensions?: {code?: string}}[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createAdmin(shop: string, token: string): Admin {
  const endpoint = `https://${shop}/admin/api/${API_VERSION}/graphql.json`;

  async function query<T>(
    operation: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token,
        },
        body: JSON.stringify({query: operation, variables}),
      });
      const throttled = response.status === 429;
      const body = throttled
        ? null
        : ((await response
            .json()
            .catch(() => null)) as GraphQLResponse<T> | null);
      const rateLimited =
        throttled ||
        body?.errors?.some((e) => e.extensions?.code === 'THROTTLED');
      if (rateLimited && attempt < 6) {
        await sleep(1000 * 2 ** (attempt - 1));
        continue;
      }
      if (!response.ok && !body)
        throw new Error(
          `Admin API HTTP ${response.status} for ${operationName(operation)}`,
        );
      if (body?.errors?.length) {
        throw new Error(
          `${operationName(operation)}: ${body.errors.map((e) => e.message).join('; ')}`,
        );
      }
      if (!body?.data)
        throw new Error(
          `${operationName(operation)}: empty response (HTTP ${response.status})`,
        );
      return body.data;
    }
  }

  return {shop, query};
}

function operationName(operation: string): string {
  return operation.match(/(?:query|mutation)\s+(\w+)/)?.[1] ?? 'GraphQL';
}

/** Throws on a mutation's userErrors, naming the step. */
export function check(
  step: string,
  userErrors:
    | {field?: string[] | null; message: string; code?: string | null}[]
    | undefined,
) {
  if (userErrors?.length) {
    const detail = userErrors
      .map(
        (e) =>
          `${e.field?.length ? `${e.field.join('.')}: ` : ''}${e.message}${e.code ? ` (${e.code})` : ''}`,
      )
      .join('; ');
    throw new Error(`${step}: ${detail}`);
  }
}

// ---------- files ----------

const STAGED_UPLOADS = `#graphql
  mutation FireboxStagedUploads($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets { url resourceUrl parameters { name value } }
      userErrors { field message }
    }
  }
`;

const FILE_CREATE = `#graphql
  mutation FireboxFileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files { id fileStatus alt }
      userErrors { field message code }
    }
  }
`;

const FILE_STATUS = `#graphql
  query FireboxFileStatus($ids: [ID!]!) {
    nodes(ids: $ids) { id ... on MediaImage { fileStatus fileErrors { message } } }
  }
`;

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/** Uploads a local image to Shopify Files (staged upload → fileCreate) and returns its MediaImage id. */
export async function uploadImage(
  admin: Admin,
  path: string,
  alt: string,
): Promise<string> {
  const filename = basename(path);
  const mimeType =
    MIME[filename.slice(filename.lastIndexOf('.')).toLowerCase()];
  if (!mimeType) throw new Error(`Unsupported image type: ${filename}`);
  const [bytes, info] = await Promise.all([readFile(path), stat(path)]);

  const staged = await admin.query<{
    stagedUploadsCreate: {
      stagedTargets: {
        url: string;
        resourceUrl: string;
        parameters: {name: string; value: string}[];
      }[];
      userErrors: {field: string[]; message: string}[];
    };
  }>(STAGED_UPLOADS, {
    input: [
      {
        filename,
        mimeType,
        resource: 'IMAGE',
        httpMethod: 'POST',
        fileSize: String(info.size),
      },
    ],
  });
  check(
    `stagedUploadsCreate ${filename}`,
    staged.stagedUploadsCreate.userErrors,
  );
  const target = staged.stagedUploadsCreate.stagedTargets[0];

  const form = new FormData();
  for (const {name, value} of target.parameters) form.append(name, value);
  form.append('file', new Blob([bytes], {type: mimeType}), filename);
  const upload = await fetch(target.url, {method: 'POST', body: form});
  if (!upload.ok)
    throw new Error(
      `Upload of ${filename} failed (HTTP ${upload.status}): ${(await upload.text()).slice(0, 200)}`,
    );

  const created = await admin.query<{
    fileCreate: {
      files: {id: string}[];
      userErrors: {field: string[]; message: string; code: string}[];
    };
  }>(FILE_CREATE, {
    files: [
      {originalSource: target.resourceUrl, contentType: 'IMAGE', alt, filename},
    ],
  });
  check(`fileCreate ${filename}`, created.fileCreate.userErrors);
  return created.fileCreate.files[0].id;
}

/** Waits until Shopify has processed the files (READY), or throws on a failed one. */
export async function waitForFiles(
  admin: Admin,
  ids: string[],
  timeoutMs = 120_000,
) {
  const deadline = Date.now() + timeoutMs;
  let pending = ids;
  while (pending.length) {
    const {nodes} = await admin.query<{
      nodes: ({
        id: string;
        fileStatus?: string;
        fileErrors?: {message: string}[];
      } | null)[];
    }>(FILE_STATUS, {ids: pending});
    const failed = nodes.find((n) => n?.fileStatus === 'FAILED');
    if (failed)
      throw new Error(
        `Shopify could not process file ${failed.id}: ${failed.fileErrors?.map((e) => e.message).join('; ')}`,
      );
    pending = nodes
      .filter((n) => n && n.fileStatus !== 'READY')
      .map((n) => n!.id);
    if (!pending.length) return;
    if (Date.now() > deadline)
      throw new Error(
        `Files still processing after ${timeoutMs / 1000}s: ${pending.join(', ')}`,
      );
    await sleep(2000);
  }
}
