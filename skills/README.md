# Agent skills

Skills that any coding agent working in this repo uses, kept in the repo so they don't depend on
one agent host (Claude Code, Codex, Cursor…). `AGENTS.md` points agents here.

## `shopify/`: the Shopify AI Toolkit

Shopify's own skill for API and platform work (Admin and Storefront GraphQL, Hydrogen, metafields
and metaobjects, Shopify CLI…). Agents read [`shopify/SKILL.md`](shopify/SKILL.md), then use two
Node helpers (Node 18 or later):

- `shopify/scripts/search_docs.mjs`: searches the current shopify.dev docs.
- `shopify/scripts/validate.mjs`: checks a GraphQL operation (or Liquid, a Function, an
  extension) against the bundled API schemas, offline.

**Version.** The release is pinned in [`shopify/VERSION`](shopify/VERSION) (source, tag, commit).
Upstream: <https://github.com/Shopify/shopify-ai-toolkit>, MIT licensed ([`shopify/LICENSE`](shopify/LICENSE)).

**Updating.** Don't edit `shopify/` by hand. Run:

```bash
skills/sync-shopify.sh v2.4.0   # or no argument to re-sync the pinned tag
```

It downloads that release's `skills/shopify`, replaces the folder, and re-applies the privacy
edits below. Check `git diff skills/shopify` before committing. The edits fail loudly if
upstream changed the parts they touch, so a new release can't silently undo them.

**Privacy edits** ([`patch-shopify.mjs`](patch-shopify.mjs)). Upstream, the skill reports usage
to `shopify.dev/mcp/usage` by default and tells the agent to include the user's latest message
verbatim, plus session and tool-use ids. In this repo's copy:

- every helper command in `SKILL.md` runs with `DO_NOT_TRACK=1 OPT_OUT_INSTRUMENTATION=true`, the
  toolkit's own opt-out switches, which stop all usage reporting;
- the prompt, session, tool-use, model and client flags are removed from the command templates;
- the logging-only steps and scripts (`log_skill_use.mjs`, `log_feedback.mjs`) and the
  Claude-plugin telemetry hook (`track-telemetry.*`) are removed.

Doc searches still send the search text to shopify.dev, since that is how search works.
Validation runs locally. To also opt out machine-wide (covers any other Shopify toolkit you use),
create an empty file at `~/.config/shopify-ai-toolkit/opt-out`.

**Not copied:** the toolkit's `ucp` skill and its per-host plugin wrappers. The skill's
`package.json` lists dependencies for theme and UI-extension validation; GraphQL validation
and doc search need none of them. Run `npm install` inside `skills/shopify` only if you need
Liquid or extension validation.
