import { describe, it, expect } from "vitest"
import { transformMarkdown } from "./transform.mjs"

describe("transformMarkdown — .md files", () => {
  it("preserves frontmatter", async () => {
    const input = `---
title: Guide
description: A test guide.
---

# Guide

Content here.
`
    expect(await transformMarkdown(input)).toMatchInlineSnapshot(`
      "---
      title: Guide
      description: A test guide.
      ---
      # Guide

      Content here.
      "
    `)
  })

  it("rewrites internal relative links", async () => {
    const input = `# Guide

See the [getting started](../guides/getting-started) page.
`
    expect(await transformMarkdown(input)).toMatchInlineSnapshot(`
      "# Guide

      See the [getting started](../guides/getting-started.md) page.
      "
    `)
  })

  it("rewrites internal absolute-path links", async () => {
    const input = `# Guide

See [configuration](/reference/configuration).
`
    expect(await transformMarkdown(input)).toMatchInlineSnapshot(`
      "# Guide

      See [configuration](/reference/configuration.md).
      "
    `)
  })

  it("inserts .md before # fragment", async () => {
    const input = `# Guide

See [the section](../guides/getting-started#installation).
`
    expect(await transformMarkdown(input)).toMatchInlineSnapshot(`
      "# Guide

      See [the section](../guides/getting-started.md#installation).
      "
    `)
  })

  it("leaves external https:// links unchanged", async () => {
    const input = `# Guide

See [GitHub](https://github.com/chinmina/chinmina-bridge).
`
    expect(await transformMarkdown(input)).toMatchInlineSnapshot(`
      "# Guide

      See [GitHub](https://github.com/chinmina/chinmina-bridge).
      "
    `)
  })

  it("leaves anchor-only #section links unchanged", async () => {
    const input = `# Guide

Jump to [installation](#installation).
`
    expect(await transformMarkdown(input)).toMatchInlineSnapshot(`
      "# Guide

      Jump to [installation](#installation).
      "
    `)
  })
})

describe("transformMarkdown — ::: directives", () => {
  it("converts :::caution to [!CAUTION] blockquote", async () => {
    const input = `# Page

:::caution

**Git tags are not static:** they can be updated to point to a different
commit SHA. Examine the recorded claims for the exact commit.

There are claims recorded for the exact commit of both the workflow that
produced the artifact and the commit that the artifact source was built from.

:::
`
    expect(await transformMarkdown(input)).toMatchInlineSnapshot(`
      "# Page

      > \\[!CAUTION]
      >
      > **Git tags are not static:** they can be updated to point to a different
      > commit SHA. Examine the recorded claims for the exact commit.
      >
      > There are claims recorded for the exact commit of both the workflow that
      > produced the artifact and the commit that the artifact source was built from.
      "
    `)
  })

  it("converts :::note to [!NOTE] blockquote", async () => {
    const input = `# Page

:::note
A simple note.
:::
`
    expect(await transformMarkdown(input)).toMatchInlineSnapshot(`
      "# Page

      > \\[!NOTE]
      >
      > A simple note.
      "
    `)
  })

  it("converts :::tip to [!TIP] blockquote", async () => {
    const input = `# Page

:::tip
A helpful tip.
:::
`
    expect(await transformMarkdown(input)).toMatchInlineSnapshot(`
      "# Page

      > \\[!TIP]
      >
      > A helpful tip.
      "
    `)
  })
})

describe("transformMarkdown — .mdx files", () => {
  it("strips import statements", async () => {
    const input = `import { Card } from "@astrojs/starlight/components"

# Page

Content here.
`
    expect(await transformMarkdown(input, { isMdx: true })).toMatchInlineSnapshot(`
      "# Page

      Content here.
      "
    `)
  })

  it("strips export statements", async () => {
    const input = `export const title = "Hello"

# Page

Content here.
`
    expect(await transformMarkdown(input, { isMdx: true })).toMatchInlineSnapshot(`
      "# Page

      Content here.
      "
    `)
  })

  it("renders <Aside type=\"note\"> as GitHub blockquote admonition", async () => {
    const input = `# Page

<Aside type="note">
This is important.
</Aside>
`
    expect(await transformMarkdown(input, { isMdx: true })).toMatchInlineSnapshot(`
      "# Page

      > \\[!NOTE]
      >
      > This is important.
      "
    `)
  })

  it("renders <Aside type=\"tip\"> as [!TIP] blockquote", async () => {
    const input = `# Page

<Aside type="tip">
A helpful tip.
</Aside>
`
    expect(await transformMarkdown(input, { isMdx: true })).toMatchInlineSnapshot(`
      "# Page

      > \\[!TIP]
      >
      > A helpful tip.
      "
    `)
  })

  it("renders <Aside type=\"caution\"> as [!CAUTION] blockquote", async () => {
    const input = `# Page

<Aside type="caution">
Be careful here.
</Aside>
`
    expect(await transformMarkdown(input, { isMdx: true })).toMatchInlineSnapshot(`
      "# Page

      > \\[!CAUTION]
      >
      > Be careful here.
      "
    `)
  })

  it("renders <ConfigRef name=\"X\" /> as a linked inline code reference", async () => {
    const input = `# Page

Set <ConfigRef name="JWT_BUILDKITE_ORGANIZATION_SLUG" /> to your org slug.
`
    expect(await transformMarkdown(input, { isMdx: true })).toMatchInlineSnapshot(`
      "# Page

      Set [\`JWT_BUILDKITE_ORGANIZATION_SLUG\`](../reference/configuration.md#jwt_buildkite_organization_slug) to your org slug.
      "
    `)
  })

  it("renders inline <Later name=\"X\" /> as backtick placeholder", async () => {
    const input = `# Page

Save the token as <Later name="BUILDKITE_API_TOKEN" />.
`
    expect(await transformMarkdown(input, { isMdx: true })).toMatchInlineSnapshot(`
      "# Page

      Save the token as \`📝 BUILDKITE_API_TOKEN\`.
      "
    `)
  })

  it("unwraps unknown PascalCase component, keeping children as prose", async () => {
    const input = `# Page

<Card title="Example">
Some content.
</Card>
`
    expect(await transformMarkdown(input, { isMdx: true })).toMatchInlineSnapshot(`
      "# Page

      Some content.
      "
    `)
  })

  it("strips MDX expression blocks (e.g. {/* comment */})", async () => {
    const input = `# Page

{/* This is a comment */}

Content here.
`
    expect(await transformMarkdown(input, { isMdx: true })).toMatchInlineSnapshot(`
      "# Page

      Content here.
      "
    `)
  })

  it("leaves lowercase HTML tags unchanged", async () => {
    const input = `# Page

Some text with <em>emphasis</em> and a line break.<br />
`
    expect(await transformMarkdown(input, { isMdx: true })).toMatchInlineSnapshot(`
      "# Page

      Some text with <em>emphasis</em> and a line break.<br />
      "
    `)
  })

  it("applies both MDX stripping and link rewriting", async () => {
    const input = `import { Card } from "@astrojs/starlight/components"

# Page

<Card title="Example">
See [getting started](../guides/getting-started#setup).
</Card>
`
    expect(await transformMarkdown(input, { isMdx: true })).toMatchInlineSnapshot(`
      "# Page

      See [getting started](../guides/getting-started.md#setup).
      "
    `)
  })
})
