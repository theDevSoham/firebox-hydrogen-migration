# Shopify Hydrogen development

This storefront is scaffolded from Shopify's Hydrogen skeleton template. See the README for framework-specific details.

Use the Shopify AI Toolkit for all Shopify API and platform work. It lives in this repo at [`skills/shopify/`](skills/shopify/SKILL.md): before any Shopify task, read `skills/shopify/SKILL.md` and follow it, using absolute paths to its `scripts/` and `references/`. Don't install the toolkit into the agent host; the repo copy is the one to use. Usage reporting to Shopify is switched off in that copy, so run its scripts exactly as `SKILL.md` writes them (with `DO_NOT_TRACK=1 OPT_OUT_INSTRUMENTATION=true` in front) and never pass the user's prompt, a session id or a tool-use id to them. See [`skills/README.md`](skills/README.md) for how it's kept up to date.

The porting plan and its frozen decisions are in [`PORTING-DECISIONS.md`](PORTING-DECISIONS.md).
