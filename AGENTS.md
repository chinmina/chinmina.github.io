# Writing Guide for AI Agents

This document guides AI agents in producing documentation that matches the existing voice and style of this repository, avoiding typical LLM-generated patterns.

## Testing edits

This is an Astro Starlight documentation repository that uses PNPM to run JS tasks.

- `pnpm run build`: check and build the site to `dist/`
- `pnpm run dev`: runs a local dev server that can be accessed via a browser

Run `pnpm run build` before committing or pushing any changes.

## Writing documentation

When writing or editing documentation, use the `docs` skill in `.claude/skills/docs/`. It contains the voice rules, content type guidance, formatting conventions, and MDX patterns for this repository.
