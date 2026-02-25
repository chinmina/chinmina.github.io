# Content Types and File Organization

Detailed templates for each content type and file organization conventions. The high-level Diátaxis framework and mental model are in the parent SKILL.md; this reference provides the detailed structure for creating or restructuring pages.

## How-to Guides

How-to guides help users accomplish specific tasks. They assume the reader knows what they want to achieve.

**Structure:**

- Title format: Verb-first or "How to [achieve X]"
- Open with a brief statement of what the guide accomplishes
- Use numbered steps with the `<Steps>` component
- End when the task is complete—no summary needed

**Include:**

- Prerequisites (as a brief list before steps)
- Concrete actions the user must take
- Expected outcomes after key steps

**Exclude:**

- Extended explanations of why things work
- Alternative approaches (link to them if necessary)
- Reference-style exhaustive option lists

**Example opening:**

> "This guide configures Chinmina to use AWS KMS for private key storage."

## Reference Documentation

Reference material provides facts for lookup during active work.

**Structure:**

- Organize by the structure of what's being described (API endpoints, config parameters)
- Use consistent patterns (H6 for parameters, tables for options)
- Be exhaustive—list every option

**Include:**

- Every parameter, option, or field
- Default values and types
- Brief usage examples

**Exclude:**

- Step-by-step procedures (link to guides)
- Extended conceptual explanation
- Opinions or recommendations (state facts)

**Example entry:**

> ###### `SERVER_PORT`
>
> _(default: `8080`)_
> The port that the Chinmina service will bind to on startup.

## Conceptual Explanation

Explanation content builds understanding. Use sparingly and place thoughtfully.

**When to include explanation:**

- Introduction to a complex topic before procedures
- Background that helps users make informed decisions
- Architecture or design rationale

**Where to place it:**

- Brief context: inline at the start of a guide section
- Extended explanation: in introduction.md or a dedicated page
- System concepts: in the introduction

**Structure:**

- Use paragraphs, not lists
- Connect to related concepts
- Admit alternatives and trade-offs

**Concept Introduction Pattern:**

When introducing a new concept, follow this structure:

1. **Definition**: What is it?
2. **Purpose**: Why does it exist?
3. **Mechanics**: How does it work?

**Example:**

> "Audit logs provide a level of non-repudiation for the system (Purpose). These logs are written to the container's stdout, and cannot be disabled (Mechanics)."

**Example:**

> "Organization profiles are a way to facilitate cross-repository access for pipelines as well as managing the permissions provided by the tokens that Chinmina Bridge creates."

## File Organization

### File Naming

- Use lowercase with hyphens (kebab-case)
- Use `.mdx` for files requiring JSX components
- Use `.md` for pure Markdown content with directive syntax

### Directory Structure

```
src/content/docs/
├── index.mdx                    # Landing page
├── introduction.md              # System overview and concepts (Explanation)
├── guides/                      # How-to guides and tutorials (Action-oriented)
│   ├── getting-started.mdx      # Tutorial: first-time setup
│   ├── kms.mdx                  # How-to: KMS configuration
│   └── ...
├── reference/                   # Reference documentation (Information-oriented)
│   ├── configuration.md         # All configuration parameters
│   ├── api/                     # API endpoint reference
│   └── profiles/                # Profile schema reference
└── contributing/                # Contributor guides (How-to)
    └── ...
```
