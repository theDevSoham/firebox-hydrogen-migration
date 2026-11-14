// Checks every Admin API operation in ./operations.ts against the Admin API schema, offline, with
// the Shopify AI Toolkit's validator (skills/shopify, usage reporting off). Run it after editing
// an operation or moving API_VERSION:  npm run shopify:validate

import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {API_VERSION} from './admin';
import {OPERATIONS} from './operations';

const validator = resolve('skills/shopify/scripts/validate.mjs');
let failed = 0;

for (const [name, operation] of Object.entries(OPERATIONS)) {
  const code = operation.replace(/^\s*#graphql\s*/, '');
  let output: string;
  try {
    output = execFileSync(
      'node',
      [validator, '--api', 'admin', '--version', API_VERSION, '--code', code],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          DO_NOT_TRACK: '1',
          OPT_OUT_INSTRUMENTATION: 'true',
        },
      },
    );
  } catch (error) {
    output = String((error as {stdout?: string}).stdout ?? error);
  }
  const valid = /Overall Status:\*\* ✅/.test(output);
  const deprecated = /deprecated/i.test(output);
  const scopes = output.match(/Required scopes: (.*)/)?.[1] ?? '';
  if (valid && !deprecated) {
    console.log(`✅ ${name}${scopes ? `  (${scopes})` : ''}`);
  } else {
    failed++;
    const detail =
      output.match(/\*\*Details:\*\* (.*)/)?.[1] ?? output.slice(0, 400);
    console.log(`❌ ${name}\n   ${detail}`);
  }
}

console.log(
  failed
    ? `\n${failed} operation(s) need attention.`
    : `\nAll ${Object.keys(OPERATIONS).length} operations are valid for Admin API ${API_VERSION}.`,
);
process.exit(failed ? 1 : 0);
