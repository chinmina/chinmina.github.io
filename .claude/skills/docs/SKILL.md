---
name: docs
description: Writing guide for documentation in this repository. Covers voice, structure, content types, and MDX conventions. Use when writing or editing any documentation page.
---

# Documentation Writing Guide

This is an Astro Starlight documentation site for Chinmina Bridge. Documentation targets DevOps and platform engineers who are knowledgeable but unfamiliar with this specific system.

## Content Architecture: Diátaxis Framework

This site uses a simplified two-section structure based on the Diátaxis framework:

| Section       | Contains                                   | User Need                      |
| ------------- | ------------------------------------------ | ------------------------------ |
| **Guides**    | How-to guides, tutorials, setup procedures | "Help me do X" or "Teach me Y" |
| **Reference** | Configuration, API, schema documentation   | "Tell me the facts about X"    |

Explanation (conceptual/background content) is woven into guides where necessary, or placed in introduction.md for system-level concepts.

### User Mental State

The content type determines voice, structure, and level of detail. When classifying content, consider what the user is thinking:

| Section       | User is thinking...                          |
| ------------- | -------------------------------------------- |
| **Guides**    | "I need to do X" / "How do I...?"            |
| **Reference** | "What is X?" / "What are the options for Y?" |

### Quick Decision

- Does the content teach a **process**? → **Guide**
- Does the content describe a **thing** (config, API, schema)? → **Reference**

## Voice Rules

- **Register:** Technical-professional. Use terms directly without over-explanation.
- **Perspective in Guides:** Second person ("you") and imperative mood. Start instructions with the action verb.
- **Perspective in Reference:** Third person and declarative mood. Describe what things are and do.
- **No first person:** Never use "I" or "we" in any content type.
- **Directness:** State facts plainly. Make confident recommendations. State limitations without apologizing.
- **No filler:** Never use "Let's dive in", "It's important to note", "As mentioned earlier", or similar padding.
- **No hedging:** Never use "You might want to consider", "It's generally a good idea", or similar softening.
- **No rhetorical questions:** State information directly instead of asking "But what does this mean?"
- **No apologetic language:** Never use "This might seem complicated, but..." or "Don't worry..."
- **Sentences:** Aim for under 20 words. Single-sentence paragraphs are acceptable.

## Summary Checklist

Before finalizing content, verify:

1. **Mode**: Am I writing a Guide (action) or Reference (facts)?
2. **Perspective**: Guides use "you" + imperative; Reference uses third person + declarative
3. **Structure**: Concepts follow Definition → Purpose → Mechanics
4. **Format**: Titles in sentence case; `<Steps>` and `<Aside>` imported if used
5. **Tone**: Guides "coach"; Reference "defines"
6. **Style**: Direct, concise, honest—no filler, hedging, or rhetorical questions

When in doubt, review existing documentation in this repository and match its patterns rather than defaulting to typical AI-generated prose.

## References

Consult these for detailed guidance beyond the essentials above:

| Reference | When to consult |
| --------- | --------------- |
| `references/voice-and-anti-patterns.md` | Writing new content or substantial rewrites. Full good/bad example pairs for tone, perspective, and anti-patterns. |
| `references/content-types.md` | Creating new pages or restructuring content. Detailed templates for guides, reference docs, and conceptual explanation, plus file organization conventions. |
| `references/formatting-and-structure.md` | Choosing between prose and lists, formatting inline elements, structuring sentences. Covers paragraph length, bold/code/link conventions. |
| `references/mdx-conventions.md` | Creating `.mdx` files, adding Starlight components, setting up frontmatter. Covers Aside, Steps, code blocks, D2 diagrams, and repo-specific patterns. |
