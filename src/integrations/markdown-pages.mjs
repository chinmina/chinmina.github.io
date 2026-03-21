import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { resolve, dirname, join } from "node:path"
import { glob } from "node:fs/promises"
import { transformMarkdown } from "./transform.mjs"

/**
 * Astro integration that serves raw markdown at `.md` routes for LLM consumption.
 *
 * - Dev: Vite middleware intercepts `*.md` requests and returns transformed source
 * - Build: writes transformed `.md` files alongside HTML output in `dist/`
 */
export default function markdownPages() {
  return {
    name: "markdown-pages",

    hooks: {
      "astro:server:setup": ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url ?? ""
          if (!url.endsWith(".md")) return next()

          // Map URL path to source file: strip leading `/` and `.md` suffix
          const urlPath = url.replace(/\.md$/, "").replace(/^\//, "")
          const srcBase = resolve("src/content/docs", urlPath)

          let content, isMdx
          try {
            try {
              content = readFileSync(srcBase + ".mdx", "utf8")
              isMdx = true
            } catch {
              content = readFileSync(srcBase + ".md", "utf8")
              isMdx = false
            }
          } catch {
            return next()
          }

          const transformed = await transformMarkdown(content, { isMdx })
          res.setHeader("Content-Type", "text/markdown; charset=utf-8")
          res.end(transformed)
        })
      },

      "astro:build:done": async ({ dir }) => {
        const docsDir = resolve("src/content/docs")
        const distDir = dir.pathname.replace(/\/$/, "")

        const files = []
        for await (const file of glob("**/*.{md,mdx}", { cwd: docsDir })) {
          files.push(file)
        }

        for (const file of files) {
          const srcPath = join(docsDir, file)
          const isMdx = file.endsWith(".mdx")
          const content = readFileSync(srcPath, "utf8")
          const transformed = await transformMarkdown(content, { isMdx })

          // Strip .mdx extension and use .md; keep .md as-is
          const outRelative = isMdx ? file.replace(/\.mdx$/, ".md") : file
          const outPath = join(distDir, outRelative)

          mkdirSync(dirname(outPath), { recursive: true })
          writeFileSync(outPath, transformed, "utf8")
        }
      },
    },
  }
}
