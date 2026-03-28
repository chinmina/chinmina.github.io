import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { glob } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { transformMarkdown } from "./transform.mjs"

/**
 * Extract title and description from a raw frontmatter block.
 * Only handles simple string values — sufficient for docs frontmatter.
 */
function parseFrontmatterFields(frontmatter) {
  const result = {}
  for (const line of frontmatter.split("\n")) {
    const m = line.match(/^(title|description):\s*(.+)$/)
    if (m) {
      result[m[1]] = m[2].trim().replace(/^["']|["']$/g, "")
    }
  }
  return result
}

/** Extract raw frontmatter block (including --- delimiters) from file content. */
function extractFrontmatterBlock(content) {
  if (!content.startsWith("---")) {
    return null
  }
  const end = content.indexOf("\n---", 3)
  if (end === -1) {
    return null
  }
  return content.slice(0, end + 4)
}

/**
 * Flatten a sidebar items array to an array of slug strings, recursing into groups.
 * Does not handle `autogenerate` — callers must resolve those separately.
 */
function flattenSlugs(items) {
  const slugs = []
  for (const item of items) {
    if (typeof item === "string") {
      slugs.push(item)
    } else if (item.link) {
      slugs.push(item.link)
    } else if (item.items) {
      slugs.push(...flattenSlugs(item.items))
    }
    // autogenerate entries are skipped here; handled at the top-level section loop
  }
  return slugs
}

/**
 * Compute the output path for a source file, flattening index pages.
 * `contributing/index.mdx` → `contributing.md`, `index.mdx` → `index.md`,
 * `getting-started.mdx` → `getting-started.md`.
 */
export function buildOutputPath(file) {
  return file.replace(/(?:\/index)?\.(mdx|md)$/, ".md")
}

/**
 * Generate llms.txt content from the sidebar config and page frontmatter cache.
 *
 * @param {object} opts
 * @param {string} opts.siteTitle
 * @param {string|undefined} opts.siteDescription
 * @param {Array} opts.sidebar
 * @param {string} opts.siteUrl  absolute site URL without trailing slash
 * @param {string} opts.docsDir  absolute path to src/content/docs
 * @param {Map<string, {title?: string, description?: string}>} pageCache  slug → metadata
 */
export async function generateLlmsTxt({
  siteTitle,
  siteDescription,
  sidebar,
  siteUrl,
  docsDir,
  pageCache,
}) {
  const lines = []
  lines.push(`# ${siteTitle}`, "")
  if (siteDescription) {
    lines.push(`> ${siteDescription}`, "")
  }

  for (const section of sidebar) {
    lines.push(`## ${section.label}`, "")

    let slugs = []
    if (section.link) {
      slugs = [section.link]
    } else if (section.items) {
      slugs = flattenSlugs(section.items)
    } else if (section.autogenerate) {
      const dir = section.autogenerate.directory
      const found = []
      for await (const file of glob(`${dir}/**/*.{md,mdx}`, { cwd: docsDir })) {
        found.push(
          file.replace(/\/index\.(md|mdx)$/, "").replace(/\.(md|mdx)$/, ""),
        )
      }
      found.sort()
      slugs = found
    }

    for (const slug of slugs) {
      const meta = pageCache.get(slug)
      const title = meta?.title ?? slug
      const description = meta?.description
      const mdFile = `${slug}.md`
      const url = `${siteUrl}/${mdFile}`
      lines.push(
        description
          ? `- [${title}](${url}): ${description}`
          : `- [${title}](${url})`,
      )
    }
    lines.push("")
  }

  return lines.join("\n")
}

/**
 * Astro integration that serves raw markdown at `.md` routes for LLM consumption.
 *
 * Options:
 * - `sidebar`         Starlight sidebar config array — used to generate llms.txt
 * - `siteTitle`       Site title for the llms.txt header
 * - `siteDescription` Optional one-line site description for llms.txt
 *
 * - Dev: Vite middleware intercepts `*.md` requests and returns transformed source
 * - Build: writes transformed `.md` files alongside HTML output in `dist/`,
 *          and generates `llms.txt` at the root if sidebar config is provided
 */
export default function markdownPages({
  sidebar,
  siteTitle,
  siteDescription,
} = {}) {
  let siteUrl = ""

  return {
    name: "markdown-pages",

    hooks: {
      "astro:config:done": ({ config }) => {
        siteUrl = config.site?.replace(/\/$/, "") ?? ""
      },

      "astro:server:setup": ({ server }) => {
        const devDocsDir = resolve("src/content/docs")
        server.middlewares.use(async (req, res, next) => {
          const url = req.url ?? ""
          if (!url.endsWith(".md")) {
            return next()
          }

          // Map URL path to source file: strip leading `/` and `.md` suffix
          const urlPath = url.replace(/\.md$/, "").replace(/^\//, "")
          const srcBase = resolve(devDocsDir, urlPath)

          // Reject paths that escape the docs root
          if (!srcBase.startsWith(`${devDocsDir}/`) && srcBase !== devDocsDir) {
            return next()
          }

          let content, isMdx
          try {
            try {
              content = readFileSync(`${srcBase}.mdx`, "utf8")
              isMdx = true
            } catch {
              content = readFileSync(`${srcBase}.md`, "utf8")
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

        // Build frontmatter cache while generating .md files
        const pageCache = new Map()

        for (const file of files) {
          const srcPath = join(docsDir, file)
          const isMdx = file.endsWith(".mdx")
          const content = readFileSync(srcPath, "utf8")

          // Normalize slug: strip /index suffix so it matches sidebar entries
          const isIndex = /\/index\.(md|mdx)$/.test(file)
          const slug = isIndex
            ? file.replace(/\/index\.(md|mdx)$/, "")
            : file.replace(/\.(md|mdx)$/, "")
          const frontmatterBlock = extractFrontmatterBlock(content)
          const fields = frontmatterBlock
            ? parseFrontmatterFields(frontmatterBlock)
            : {}
          pageCache.set(slug, fields)

          const transformed = await transformMarkdown(content, { isMdx })
          const outPath = join(distDir, buildOutputPath(file))

          mkdirSync(dirname(outPath), { recursive: true })
          writeFileSync(outPath, transformed, "utf8")
        }

        if (sidebar && siteTitle) {
          const llmsTxt = await generateLlmsTxt({
            siteTitle,
            siteDescription,
            sidebar,
            siteUrl,
            docsDir,
            pageCache,
          })
          writeFileSync(join(distDir, "llms.txt"), llmsTxt, "utf8")
        }
      },
    },
  }
}
