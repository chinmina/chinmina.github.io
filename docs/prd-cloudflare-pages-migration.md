# Migrate Hosting to Cloudflare Pages

## Problem Statement

The documentation site is currently hosted on GitHub Pages at `chinmina.github.io`. The `chinmina.dev` domain has been registered with Cloudflare, and the canonical home for the docs should be `docs.chinmina.dev`. GitHub Pages does not integrate with the Cloudflare-managed domain, and the two deployments need to coexist during the transition while search engines index the new URL.

## Solution

Deploy the site to Cloudflare Pages (project: `chinmina`) via the existing GitHub Actions pipeline. The Astro `site` config is updated to `https://docs.chinmina.dev`, which causes all builds — both Cloudflare Pages and GitHub Pages — to emit canonical links pointing to the new domain. GitHub Pages remains live and up to date throughout, serving as a fallback and preserving the old URL until a redirect strategy is decided separately.

## Requirements

### Canonical URL and SEO

1. The site shall set `https://docs.chinmina.dev` as the canonical base URL in `astro.config.mjs`.
2. The site shall emit a `<link rel="canonical">` tag on every page, resolving to the corresponding URL under `https://docs.chinmina.dev`.
3. When a build is deployed to GitHub Pages, the system shall emit canonical links pointing to `https://docs.chinmina.dev`, not to `chinmina.github.io`.

### Cloudflare Pages Deployment

4. When a commit is pushed to `main`, the CI shall build the site and deploy it to Cloudflare Pages as a production deployment under `https://chinmina.pages.dev`.
5. When a pull request is opened or updated, the CI shall build the site and deploy it to a Cloudflare Pages preview URL.
6. While a pull request is open, its Cloudflare Pages preview deployment shall remain accessible at its preview URL.
7. When a Cloudflare Pages deployment completes, the CI shall surface the deployment URL in the workflow summary.
8. If the Cloudflare Pages deployment step fails, then the CI shall fail and not mark the workflow as successful.

### GitHub Pages Deployment (Continued)

9. When a commit is pushed to `main`, the CI shall also deploy the same build to GitHub Pages.
10. If the GitHub Pages deployment step fails, then the CI shall fail and not mark the workflow as successful.

### Build Pipeline

11. The CI shall install the D2 diagramming tool before running the Astro build.
12. The CI shall produce a single build artifact shared by both the Cloudflare Pages and GitHub Pages deployment jobs.
13. If the build step fails, then the CI shall not attempt either deployment.

### DNS and Domain

14. The system shall serve the Cloudflare Pages production deployment at `https://docs.chinmina.dev` via a DNS CNAME record in Cloudflare.
15. The Cloudflare Pages project shall enforce HTTPS for all requests to `docs.chinmina.dev`.

### Optional

16. Where a pull request triggers a CI build, the CI shall output the Cloudflare Pages preview URL as a GitHub Actions step summary.

## Implementation Decisions

**Workflow restructure**: The current `withastro/action` couples the build to GitHub Pages artifact upload. To share one build between two deploy targets, the build must be extracted into explicit steps: install D2, set up Node.js (via `actions/setup-node` with `enable-corepack: true` — corepack reads the `packageManager` field in `package.json` and provisions the pinned pnpm version automatically), run `pnpm install`, run `pnpm run build`, then upload two artifacts — one as a GitHub Pages artifact (`actions/upload-pages-artifact`) and one as a generic `dist/` artifact (`actions/upload-artifact`). The two deploy jobs run in parallel after the build job completes.

**GitHub Pages deploy job**: Unchanged in behaviour. Conditional on `github.ref == 'refs/heads/main'`. Consumes the GitHub Pages artifact via `actions/deploy-pages`.

**Cloudflare Pages deploy job**: Runs on all branches (for preview support). Downloads the `dist/` artifact and deploys via `cloudflare/wrangler-action` with `command: pages deploy dist --project-name=chinmina`. Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions secrets.

**`wrangler.toml`**: A minimal `wrangler.toml` at the repo root declares `name = "chinmina"` and `pages_build_output_dir = "dist"`. This makes the project identity explicit and removes the need to pass flags in the workflow command.

**Canonical link handling**: Astro emits `<link rel="canonical">` automatically based on the `site` config. Changing `site` to `https://docs.chinmina.dev` is sufficient — no changes to `Head.astro` are required. The `site` change and the Cloudflare Pages go-live must ship in the same merge to avoid a window where GitHub Pages serves canonicals pointing to a domain not yet live.

**Cloudflare Pages project**: Must be created in the Cloudflare dashboard (or via Wrangler) before the first deployment. Custom domain `docs.chinmina.dev` is configured in the Cloudflare Pages project settings. DNS is a CNAME record: `docs.chinmina.dev` → `chinmina.pages.dev`.

**GitHub Pages remains live**: GitHub Pages is not disabled as part of this work. It continues to receive deployments from `main` and serves the site at `chinmina.github.io` with canonical links pointing to `docs.chinmina.dev`. Decommissioning GitHub Pages is deferred to a future redirect-strategy workstream.

**GitHub Actions secrets needed**:
- `CLOUDFLARE_API_TOKEN` — scoped to Cloudflare Pages edit permissions
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account hosting the `chinmina` project

## Testing Decisions

This is an infrastructure and configuration change. There are no unit tests. All requirements map to manual acceptance checks performed after deployment:

| Requirement | Verification |
|---|---|
| 1–3 (canonical) | View page source on both `docs.chinmina.dev` and `chinmina.github.io`; confirm canonical tag resolves to `docs.chinmina.dev` |
| 4 (production deploy) | Merge to `main`; confirm Cloudflare Pages production deployment succeeds and site is reachable at `chinmina.pages.dev` |
| 5–6 (preview deploy) | Open a PR; confirm a preview URL appears in the workflow summary and is reachable |
| 9 (GH Pages continued) | Merge to `main`; confirm GitHub Pages deployment succeeds and `chinmina.github.io` reflects the change |
| 11 (D2) | Confirm a page containing a D2 diagram renders correctly on `docs.chinmina.dev` |
| 14–15 (DNS + HTTPS) | `curl -I https://docs.chinmina.dev`; confirm 200 and valid TLS certificate |

## Out of Scope

- Redirecting `chinmina.github.io` to `docs.chinmina.dev` (deferred to a separate workstream)
- Disabling GitHub Pages
- Redirecting the apex domain `chinmina.dev` to `docs.chinmina.dev`
- Any changes to site content or structure

## Further Notes

The `withastro/action` action is a convenience wrapper that bundles Node.js setup, pnpm detection, build, and GitHub Pages artifact upload in one step. Replacing it with explicit steps adds a few lines to the workflow but gives full control over the build environment — necessary here because of the D2 pre-install step and the need to share the build output with a second deploy target.

The Cloudflare Pages project must exist before the first pipeline run. Creating it via the Cloudflare dashboard (connect to GitHub, select repo, set build command to `pnpm run build` and output dir to `dist`) is the recommended path, but with `wrangler.toml` in place, `wrangler pages project create chinmina` also works.
