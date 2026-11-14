/* eslint-disable no-console -- a command-line script: it reports what it did. */
// Applies this repo's privacy edits to the copied-in Shopify AI Toolkit skill (skills/shopify).
// Run by skills/sync-shopify.sh after every update; safe to run on its own too.
//
// Upstream, SKILL.md tells the agent to send the user's latest message verbatim, plus session and
// tool-use ids, to shopify.dev/mcp/usage, and to run two logging-only scripts. Here:
//   - every helper command runs with the toolkit's own opt-out switches set
//     (DO_NOT_TRACK=1 OPT_OUT_INSTRUMENTATION=true), which stops all usage reporting;
//   - the prompt / session / tool-use / model / client / artifact flags are removed from the
//     command templates and the instructions to fill them in are replaced;
//   - the logging-only steps (log_skill_use.mjs, log_feedback.mjs) are dropped and those
//     scripts, plus the Claude-plugin telemetry hook, are deleted;
//   - the Claude-plugin `hooks:` frontmatter is removed (it only works inside the plugin).
// Doc searches still go to shopify.dev: that request is how search works.
//
// Every edit must find its anchor, or the script fails, so an upstream change can't silently
// undo the privacy edits.

import {readFileSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const skill = join(dirname(fileURLToPath(import.meta.url)), 'shopify');
const file = join(skill, 'SKILL.md');
let md = readFileSync(file, 'utf8');

const ENV = 'DO_NOT_TRACK=1 OPT_OUT_INSTRUMENTATION=true';
const MARKER = '<!-- repo-patch: privacy -->';

if (md.includes(MARKER)) {
  console.log('skills/shopify/SKILL.md is already patched.');
  process.exit(0);
}

function replace(from, to, {all = false} = {}) {
  const hit = from instanceof RegExp ? from.test(md) : md.includes(from);
  if (!hit) {
    console.error(
      `patch-shopify: anchor not found, upstream SKILL.md changed:\n  ${from}`,
    );
    process.exit(1);
  }
  md =
    all && typeof from === 'string'
      ? md.replaceAll(from, to)
      : md.replace(from, to);
}

// 1. The Claude-plugin hook in the frontmatter.
replace(/\nhooks:\n(?: {2,}.*\n)+---\n/, '\n---\n');

// 2. Identifying flags out of every command template.
replace(
  / --model YOUR_MODEL_NAME --client-name YOUR_CLIENT_NAME --client-version YOUR_CLIENT_VERSION/g,
  '',
);
replace(
  / --user-prompt-base64 'BASE64_OF_USER_PROMPT' --session-id YOUR_SESSION_ID --tool-use-id YOUR_TOOL_USE_ID/g,
  '',
);
replace(/ --artifact-id YOUR_ARTIFACT_ID --revision REVISION_NUMBER/g, '');

// 3. Opt-out switches on every helper command.
replace(
  /^(\s*)scripts\/(search_docs|validate)\.mjs/gm,
  `$1${ENV} scripts/$2.mjs`,
);
replace(
  'Search everything with `scripts/search_docs.mjs',
  `Search everything with \`${ENV} scripts/search_docs.mjs`,
);

// 4. The logging-only steps.
replace(
  / {3}A `validate` cell of `—` means the topic has no validator\. Run this once instead[^\n]*\n[^`]*```\n[^\n]*log_skill_use\.mjs[^\n]*\n {3}```\n/,
  '   A `validate` cell of `—` means the topic has no validator; work from the reference file.\n',
);
replace(
  /5\. \*\*Before your final response\*\*, run `scripts\/log_feedback\.mjs`[\s\S]*?rather\nthan that you are unsure\.\n/,
  '',
);
replace(/\n\*\*Replace `BASE64_OF_USER_PROMPT`\*\*[^\n]*\n/, '\n');
replace(
  /\n\*\*Replace `YOUR_SESSION_ID` \/ `YOUR_TOOL_USE_ID`\*\*[^\n]*\n/,
  '\n',
);

// 5. A note at the top so any agent knows why the commands look like this.
replace(
  /^(---\n[\s\S]*?\n---\n)/,
  `$1
${MARKER}
> **This repo's copy (see skills/README.md):** usage reporting to Shopify is off. Run every helper
> exactly as written below, with \`${ENV}\` in front, and never pass the user's prompt, a session
> id or a tool-use id to any script. Doc searches still query shopify.dev; that is how search works.
`,
);

if (
  /BASE64_OF_USER_PROMPT|log_feedback|log_skill_use|user-prompt-base64/.test(
    md.replace(/> \*\*Privacy notice[\s\S]*$/, ''),
  )
) {
  console.error(
    'patch-shopify: a telemetry instruction survived the patch; check SKILL.md by hand.',
  );
  process.exit(1);
}

writeFileSync(file, md);
for (const f of [
  'log_feedback.mjs',
  'log_skill_use.mjs',
  'track-telemetry.sh',
  'track-telemetry.ps1',
]) {
  rmSync(join(skill, 'scripts', f), {force: true});
}
console.log(
  'Patched skills/shopify/SKILL.md and removed the logging-only scripts.',
);
/* eslint-enable no-console */
