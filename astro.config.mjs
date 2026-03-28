// @ts-check

import starlight from "@astrojs/starlight"
import { defineConfig } from "astro/config"
import d2 from "astro-d2"
import starlightHeadingBadges from "starlight-heading-badges"
import markdownPages from "./src/integrations/markdown-pages.mjs"

const sidebar = [
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
      "guides/deployment-example",
      "guides/verifying-releases",
    ],
  },
  {
    label: "Reference",
    items: [
      "reference/configuration",
      "reference/git-credentials-format",
      "reference/auditing",
      {
        label: "Telemetry",
        items: [
          "reference/telemetry",
          "reference/telemetry/traces",
          "reference/telemetry/metrics",
        ],
      },
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
]

// https://astro.build/config
export default defineConfig({
  site: "https://docs.chinmina.dev",
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
      sidebar,
      components: {
        Head: "./src/components/Head.astro",
        SocialIcons: "./src/components/SocialIcons.astro",
      },
    }),
    d2({
      layout: "elk",
    }),
    markdownPages({
      sidebar,
      siteTitle: "Chinmina",
      siteDescription:
        "GitHub App token vending machine for Buildkite pipelines.",
    }),
  ],
})
