// @ts-check
import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"
import starlightHeadingBadges from "starlight-heading-badges"

import d2 from "astro-d2"

// https://astro.build/config
export default defineConfig({
  site: "https://chinmina.github.io",
  trailingSlash: "never",

  integrations: [
    starlight({
      plugins: [starlightHeadingBadges()],

      title: "Chinmina",
      logo: { src: "/src/assets/chinmina-logo-white.png", alt: "Chinmina" },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/chinmina/chinmina-bridge",
        },
      ],
      sidebar: [
        {
          label: "Introduction",
          link: "introduction",
        },
        {
          label: "Guides",
          items: [
            "guides/getting-started",
            "guides/buildkite-integration",
            "guides/customizing-permissions",
            "guides/kms",
            "guides/distributed-cache",
            "guides/observability",
            "guides/verifying-releases",
          ],
        },
        {
          label: "Reference",
          items: [
            "reference/configuration",
            "reference/metrics",
            "reference/git-credentials-format",
            {
              label: "Profiles",
              items: [
                "reference/profiles",
                "reference/profiles/pipeline",
                "reference/profiles/organization",
                "reference/profiles/matching",
              ],
            },
            {
              label: "API",
              items: [
                "reference/api/health-check-and-status",
                "reference/api/pipeline-git-credentials",
                "reference/api/pipeline-token",
                "reference/api/organization-git-credentials",
                "reference/api/organization-token",
              ],
            },
          ],
        },
        {
          label: "Contributing",
          autogenerate: { directory: "contributing" },
        },
      ],
    }),
    d2({
      layout: "elk",
    }),
  ],
})
