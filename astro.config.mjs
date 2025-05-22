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
            "guides/kms",
            "guides/observability",
            "guides/verifying-releases",
          ],
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
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
