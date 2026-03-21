import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkMdx from "remark-mdx"
import remarkDirective from "remark-directive"
import remarkStringify from "remark-stringify"

/**
 * Walk all nodes in a unist tree, calling visitor(node, index, parent) for each.
 * Return false from visitor to skip node's children.
 */
function walk(tree, visitor) {
  function traverse(node, index, parent) {
    const result = visitor(node, index, parent)
    if (result === false) return
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        traverse(node.children[i], i, node)
      }
    }
  }
  traverse(tree, null, null)
}

/**
 * Remark plugin: rewrite internal links to append `.md` before any `#` fragment.
 * Leaves external (http/https) and anchor-only (#) links unchanged.
 */
function remarkRewriteLinks() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== "link") return
      const url = node.url
      if (!url) return
      if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("#")) return

      const hashIndex = url.indexOf("#")
      if (hashIndex === -1) {
        node.url = url + ".md"
      } else {
        node.url = url.slice(0, hashIndex) + ".md" + url.slice(hashIndex)
      }
    })
  }
}

const DIRECTIVE_TYPE_LABEL = { note: "NOTE", tip: "TIP", caution: "CAUTION", danger: "WARNING" }

/**
 * Remark plugin: convert :::note/tip/caution/danger container directives
 * to GitHub-flavoured blockquote admonitions.
 */
function remarkDirectivesToBlockquotes() {
  return (tree) => {
    function convert(nodes) {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (node.type === "containerDirective" && DIRECTIVE_TYPE_LABEL[node.name]) {
          const label = DIRECTIVE_TYPE_LABEL[node.name]
          nodes[i] = {
            type: "blockquote",
            children: [
              { type: "paragraph", children: [{ type: "text", value: `[!${label}]` }] },
              ...(node.children ?? []),
            ],
          }
        } else if (node.children) {
          convert(node.children)
        }
      }
    }
    convert(tree.children)
  }
}

/**
 * Known component translations: instead of generic child-unwrapping, these
 * components produce specific remark nodes for meaningful LLM output.
 *
 * Each function receives the MDX JSX node and returns an array of remark nodes.
 */
const COMPONENT_TRANSLATIONS = {
  /** Inline placeholder marker: <Later name="X" /> → `📝 X` */
  Later(node) {
    const nameAttr = node.attributes?.find((a) => a.name === "name")
    const name = nameAttr?.value ?? ""
    return [{ type: "inlineCode", value: `📝 ${name}` }]
  },

  /** Config reference: <ConfigRef name="X" /> → [`X`](../reference/configuration#x) */
  ConfigRef(node) {
    const nameAttr = node.attributes?.find((a) => a.name === "name")
    const name = nameAttr?.value ?? ""
    return [
      {
        type: "link",
        url: `../reference/configuration#${name.toLowerCase()}`,
        children: [{ type: "inlineCode", value: name }],
      },
    ]
  },

  /** Callout box: <Aside type="tip"> → GitHub-flavoured blockquote admonition */
  Aside(node) {
    const typeAttr = node.attributes?.find((a) => a.name === "type")
    const type = typeAttr?.value ?? "note"
    const TYPE_LABEL = { note: "NOTE", tip: "TIP", caution: "CAUTION", danger: "WARNING" }
    const label = TYPE_LABEL[type] ?? "NOTE"
    return [
      {
        type: "blockquote",
        children: [
          { type: "paragraph", children: [{ type: "text", value: `[!${label}]` }] },
          ...(node.children ?? []),
        ],
      },
    ]
  },
}

/**
 * Remark plugin: strip MDX-specific nodes and unwrap PascalCase components.
 * - Removes `mdxjsEsm` nodes (import/export statements)
 * - Removes `mdxFlowExpression`/`mdxTextExpression` nodes (MDX expression blocks)
 * - For known PascalCase components, applies a translation from COMPONENT_TRANSLATIONS
 * - For unknown PascalCase components, replaces node with its children
 * - Lowercase HTML tags are left unchanged
 */
function remarkStripMdx() {
  return (tree) => {
    const STRIP_TYPES = new Set(["mdxjsEsm", "mdxFlowExpression", "mdxTextExpression"])

    function unwrap(nodes) {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (STRIP_TYPES.has(node.type)) {
          nodes.splice(i, 1)
          i--
        } else if (
          (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
          node.name &&
          /^[A-Z]/.test(node.name)
        ) {
          const translator = COMPONENT_TRANSLATIONS[node.name]
          const replacement = translator ? translator(node) : (node.children ?? [])
          nodes.splice(i, 1, ...replacement)
          i-- // re-examine from same index; recurse into replacement children
        } else if (node.children) {
          unwrap(node.children)
        }
      }
    }
    unwrap(tree.children)
  }
}

/**
 * Extract YAML frontmatter from the top of a file.
 * Returns { frontmatter, body } where frontmatter includes the delimiters,
 * or { frontmatter: null, body: content } if none found.
 */
function extractFrontmatter(content) {
  if (!content.startsWith("---")) return { frontmatter: null, body: content }
  const end = content.indexOf("\n---", 3)
  if (end === -1) return { frontmatter: null, body: content }
  const frontmatter = content.slice(0, end + 4) // include closing ---
  const body = content.slice(end + 4)
  return { frontmatter, body }
}

/**
 * Transform markdown/MDX source content for LLM consumption.
 *
 * @param {string} content - Raw file content
 * @param {{ isMdx?: boolean }} options
 * @returns {Promise<string>} Transformed markdown
 */
export async function transformMarkdown(content, { isMdx = false } = {}) {
  const { frontmatter, body } = extractFrontmatter(content)

  const processor = unified().use(remarkParse).use(remarkDirective).use(remarkDirectivesToBlockquotes)

  if (isMdx) {
    processor.use(remarkMdx).use(remarkStripMdx)
  }

  processor.use(remarkRewriteLinks).use(remarkStringify)

  const result = await processor.process(body)
  const transformed = String(result)

  return frontmatter ? frontmatter + "\n" + transformed : transformed
}
