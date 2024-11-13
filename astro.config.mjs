// @ts-check
import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"
import starlightHeadingBadges from "starlight-heading-badges"

// https://astro.build/config
export default defineConfig({
  site: "https://chinmina.github.io",
  integrations: [
    starlight({
      plugins: [starlightHeadingBadges()],

      title: "Chinmina",
      social: {
        github: "https://github.com/chinmina/chinmina-bridge",
      },
      sidebar: [
        {
          label: "Introduction",
          link: "introduction",
        },
        {
          label: "Guides",
          autogenerate: { directory: "guides" },
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
  ],
})
