import { describe, expect, it } from "vitest"
import { buildOutputPath, generateLlmsTxt } from "./markdown-pages.mjs"

describe("generateLlmsTxt", () => {
  it("uses {slug}.md for index pages, not {slug}/index.md", async () => {
    const pageCache = new Map([
      [
        "contributing",
        {
          title: "Contributing",
          description: "How to contribute",
          _isIndex: true,
        },
      ],
    ])

    const result = await generateLlmsTxt({
      siteTitle: "Test Site",
      siteDescription: "A test site",
      sidebar: [{ label: "Docs", items: ["contributing"] }],
      siteUrl: "https://example.com",
      docsDir: "/fake",
      pageCache,
    })

    expect(result).toContain("https://example.com/contributing.md")
    expect(result).not.toContain("contributing/index.md")
  })

  it("uses {slug}.md for non-index pages", async () => {
    const pageCache = new Map([
      ["guides/getting-started", { title: "Getting Started" }],
    ])

    const result = await generateLlmsTxt({
      siteTitle: "Test Site",
      sidebar: [{ label: "Guides", items: ["guides/getting-started"] }],
      siteUrl: "https://example.com",
      docsDir: "/fake",
      pageCache,
    })

    expect(result).toContain("https://example.com/guides/getting-started.md")
  })

  it("uses index.md for the root page", async () => {
    const pageCache = new Map([
      ["index", { title: "Home", description: "Welcome", _isIndex: false }],
    ])

    const result = await generateLlmsTxt({
      siteTitle: "Test Site",
      sidebar: [{ label: "Home", items: ["index"] }],
      siteUrl: "https://example.com",
      docsDir: "/fake",
      pageCache,
    })

    expect(result).toContain("https://example.com/index.md")
  })
})

describe("buildOutputPath", () => {
  it("flattens index source pages to {slug}.md", () => {
    expect(buildOutputPath("contributing/index.mdx")).toBe("contributing.md")
    expect(buildOutputPath("contributing/index.md")).toBe("contributing.md")
  })

  it("keeps root index as index.md", () => {
    expect(buildOutputPath("index.mdx")).toBe("index.md")
    expect(buildOutputPath("index.md")).toBe("index.md")
  })

  it("keeps non-index pages as {slug}.md", () => {
    expect(buildOutputPath("getting-started.mdx")).toBe("getting-started.md")
    expect(buildOutputPath("guides/setup.md")).toBe("guides/setup.md")
  })
})
