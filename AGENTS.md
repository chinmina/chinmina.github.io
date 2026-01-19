# Writing Guide for AI Agents

This document guides AI agents in producing documentation that matches the existing voice and style of this repository, avoiding typical LLM-generated patterns.

## Testing edits

This is an Astro Starlight documentation repository that uses PNPM to run JS tasks.

- `pnpm run build`: check and build the site to `dist/`
- `pnpm run dev`: runs a local dev server that can be accessed via a browser

Run `pnpm run build` before committing or pushing any changes.

## Documentation Architecture: The Diátaxis Framework

This documentation follows the Diátaxis framework, which organizes content by user need rather than software features.

### Content Types in This Repository

This site uses a simplified two-section structure:

| Section       | Contains                                   | User Need                      |
| ------------- | ------------------------------------------ | ------------------------------ |
| **Guides**    | How-to guides, tutorials, setup procedures | "Help me do X" or "Teach me Y" |
| **Reference** | Configuration, API, schema documentation   | "Tell me the facts about X"    |

Explanation (conceptual/background content) is woven into guides where necessary, or placed in introduction.md for system-level concepts.

### User Mental State

When classifying content, consider what the user is thinking:

| Section       | User is thinking...                          |
| ------------- | -------------------------------------------- |
| **Guides**    | "I need to do X" / "How do I...?"            |
| **Reference** | "What is X?" / "What are the options for Y?" |

### Quick Decision

- Does the content teach a **process**? → **Guide**
- Does the content describe a **thing** (config, API, schema)? → **Reference**

## Tone and Voice

### Register: Technical-Professional

The documentation assumes a knowledgeable reader (DevOps engineers, platform engineers) but does not assume prior knowledge of this specific system. Technical terms are used directly without over-explanation.

**Example:**

> "Chinmina Bridge is a simple web service that acts as an intermediary between a Buildkite installation and a related GitHub App."

### Perspective (Content-Type Dependent)

**In Guides:** Use **second person ("you")** and **imperative mood**.

**Good:**

- "Before you start, there are a few things you'll need to have:"
- "Create an API key with access to the REST API."
- "Run `direnv allow` to bring the updated configuration into the environment."

**Bad:**

- "We will now explore how to set up the service..."
- "Let's create an API key together..."
- "I recommend that you consider using..."

**In Reference:** Use **third person** and **declarative mood**.

**Good:**

- "The port that the Chinmina service will bind to on startup."
- "The `timeout` field accepts an integer representing seconds."
- "The number of seconds the server will wait for existing requests to complete."

**Bad:**

- "The port you configure here will be used when the service starts."
- "You should set the timeout field to an integer."
- "You can configure the server to wait for requests."

Never use first person ("I" or "we") in any content type.

### Directness: High

State facts and instructions plainly. Avoid hedging and softening language.

**Good:**

- "This private key is an extremely sensitive credential."
- "Container distribution is recommended."
- "Chinmina needs to be self-hosted alongside the Buildkite agent infrastructure. It is a single point of failure in the system also."

**Bad:**

- "You might want to consider that this private key is somewhat sensitive..."
- "It's generally a good idea to use container distribution..."
- "While Chinmina typically needs to be self-hosted, this may vary..."

### Confidence: Assert with Honest Caveats

Make confident recommendations. State limitations clearly without apologizing.

**Good:**

- "It is **strongly** recommended that any production implementation of Chinmina (running on AWS) uses this strategy."
- "Using the `kms:RequestAlias` condition instead of the fully qualified key ARN in the `resource` attribute allows for transparent key rotation without service interruption."

Include dedicated sections for limitations when relevant:

**Drawbacks section example:**

> ## Drawbacks
>
> Chinmina needs to be self-hosted alongside the Buildkite agent infrastructure. It is a single point of failure in the system also, and critical to keep up.
>
> The private key for the GitHub application is quite powerful, and needs to be carefully protected.

## Anti-Patterns: What to Never Write

### No Filler Phrases

**Never use:**

- "Let's dive in"
- "In this guide, we will explore..."
- "It's important to note that..."
- "Now let's take a look at..."
- "As mentioned earlier..."
- "With that out of the way..."
- "Moving on to the next step..."

**Instead:** Start directly with the content.

**Bad:**

> "Now that we've covered the basics, let's dive into how to configure the server. It's important to note that..."

**Good:**

> "Configuration related to the core HTTP service."

### No Excessive Hedging

**Never use:**

- "You might want to consider..."
- "It's generally a good idea to..."
- "You could potentially..."
- "This may or may not be..."
- "In some cases, you might find that..."

**Instead:** State recommendations directly or don't make them.

**Bad:**

> "You might want to consider using a bot user to create the token, as this could potentially help when personnel changes occur..."

**Good:**

> "Use a 'bot' user to create the token if you can, as this will not be affected when personnel in your organization change."

### No Rhetorical Questions

**Never use:**

- "But what does this mean?"
- "So how does this work?"
- "Why would you want to do this?"
- "What's the best approach here?"

**Instead:** State information directly.

**Bad:**

> "But what does the audit log provide? Well, it gives you non-repudiation for the system."

**Good:**

> "Audit logs provide a level of non-repudiation for the system."

### No Apologetic Language

**Never use:**

- "This might seem complicated, but..."
- "Don't worry, this is easier than it looks..."
- "While this can be confusing..."
- "I know this seems like a lot..."

**Instead:** Present information straightforwardly. If content is incomplete, state that plainly.

**Bad:**

> "I know configuring KMS might seem complicated at first, but don't worry—we'll walk through it step by step."

**Good:**

> "This section is a stub. For now, refer to the `.envrc` file for details on the environment variables."

### No Redundant Transitions

Section transitions should be handled by clear headings, not prose.

**Bad:**

> "Now that we've covered the GitHub App setup, let's move on to the Buildkite token configuration..."

**Good:** (Just use a heading)

> ## Buildkite API Token

## Prose vs Bullets

### Use Paragraphs For

1. **Conceptual explanations** - describing what something is or why it matters
2. **Context-setting** before a procedure
3. **"How it works" sections** that describe system behavior

**Example:**

> "Organization profiles are a way to facilitate cross-repository access for pipelines as well as managing the permissions provided by the tokens that Chinmina Bridge creates."

### Use Numbered Lists For

1. **Sequential procedures** - when order matters
2. **Ordered prerequisites** - distinct items that must be completed

For procedures, use the `<Steps>` component:

```mdx
<Steps>

1. Create an application in your GitHub organization.

   Collect the "Application ID" of the application created.

2. Create and save a private key for the application.

</Steps>
```

### Use Bullet Lists For

1. **Parallel configuration options** - when items are choices or alternatives
2. **Feature lists** - describing capabilities
3. **Field documentation** - listing available fields

**Example:**

> Three endpoints are exposed:
>
> - `/token`, which returns a token and its expiry, and
> - `/git-credentials`, which returns the token and repository metadata in the Git Credentials format.
> - `/healthcheck`, which returns 200.

### Paragraph Length

Keep paragraphs to **1-3 sentences**. Single-sentence paragraphs are acceptable and common.

**Good:**

> "Chinmina itself is a simple service, but it sits in the middle of an ecosystem. This means that a working installation requires a number of setup items."
>
> "Before you start, there are a few things you'll need to have:"

**Bad:** (Single long paragraph)

> "Chinmina itself is a simple service, but it sits in the middle of an ecosystem, which means that a working installation requires a number of setup items. Before you start, there are a few things you'll need to have, including a GitHub App with appropriate permissions and a Buildkite API token with the right scopes. These requirements exist because of how the system integrates with both platforms."

## Writing for Content Types

### How-to Guides

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

### Reference Documentation

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

### Conceptual Explanation

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

## Sentence Structure

### Length: Short to Medium

Aim for sentences under 20 words. Medium-length sentences are acceptable when clarity requires.

**Good:**

- "Container distribution is recommended." (3 words)
- "This is a highly sensitive credential." (6 words)
- "The token identifies the Buildkite pipeline that is executing, so the associated repository can be looked up." (17 words)

**Bad:**

- "In order to ensure that the system functions correctly and securely, you'll want to make sure that you're using container distribution, which is the recommended approach for deploying this service in production environments." (38 words)

### Instructions: Imperative Verb First

Start instructions with the action verb. Add context after the command when necessary.

**Good:**

- "Create an application in your GitHub organization."
- "Set the environment variable `GITHUB_APP_PRIVATE_KEY_ARN` to the ARN of the **alias** that has just been created."
- "Run `direnv allow` to bring the updated configuration into the environment."

**Bad:**

- "You should create an application in your GitHub organization."
- "The environment variable `GITHUB_APP_PRIVATE_KEY_ARN` needs to be set to the ARN of the alias."
- "In order to activate the configuration, run `direnv allow`."

### Parenthetical Clarifications

Use parentheses for brief inline clarifications or examples.

**Good:**

- "(due to caching it may only last for 45 minutes however)"
- "(for example, an ECS service)"
- "(see highlight below)"

## Formatting Conventions

### Bold for Emphasis

Use bold to highlight:

- Critical warnings
- Specific values users need to collect or note
- Configuration keywords in prose

**Examples:**

- "Create an API key with access to the REST API **only** with access to the `read_pipelines` scope."
- "Set the environment variable to the ARN of the **alias** that has just been created."
- "It is **strongly** recommended that any production implementation uses this strategy."

### Inline Code

Use inline code for:

- Configuration parameter names: `SERVER_PORT`
- Environment variables: `GITHUB_APP_PRIVATE_KEY_ARN`
- Commands: `direnv allow`
- File paths: `.envrc`
- API endpoints: `/token`
- Values: `read_pipelines`

### Links

#### Internal Links

Use relative paths without file extensions:

```markdown
[Getting Started](../guides/getting-started)
[Configuration](../reference/configuration)
```

For section anchors:

```markdown
[essential configuration](getting-started#chinmina-bridge-setup)
```

#### External Links

Use reference-style definitions at the document end:

```markdown
Authentication is handled via [GitHub App][github-app] with
[ephemeral tokens][github-app-tokens].

[github-app]: https://docs.github.com/en/apps
[github-app-tokens]: https://docs.github.com/en/apps/creating-github-apps/...
```

## MDX Technical Conventions

### Asides (Callouts)

Use `<Aside>` component or `:::directive` syntax for notes, tips, and cautions.

#### With Component Import

```mdx
import { Aside } from "@astrojs/starlight/components"

<Aside type="tip">
  Use a 'bot' user to create the token if you can, as this will not be affected
  when personnel in your organization change.
</Aside>

<Aside type="caution">
  It is possible to use IaC to import private keys into KMS. Note carefully that
  this will generally leave your private key unencrypted in your state file.
</Aside>
```

#### With Directive Syntax

```markdown
:::tip

Recommendation: `chinmina:your-github-organization`. This is specific to the
purpose of the token.

:::

:::caution

Warning content here.

:::
```

With custom title:

```markdown
:::note[Important]

Content with a custom title.

:::
```

### Steps Component

Wrap numbered procedures in `<Steps>`:

```mdx
import { Steps } from "@astrojs/starlight/components"

<Steps>

1. First step description.

   Additional context or code blocks can be indented under each step.

2. Second step description.

3. Third step description.

</Steps>
```

### Code Blocks

#### Basic Code Block

Use language identifier:

````markdown
```yaml
steps:
  - command: ls
    plugins:
      - chinmina/chinmina-git-credentials#v1.0.2:
          chinmina-url: "https://chinmina-bridge-url"
```
````

#### With Title

````markdown
```bash title="Execute plugin environment hook directly"
BUILDKITE_PLUGIN_CHINMINA_TOKEN_CHINMINA_URL="..." \
    source /buildkite/plugins/chinmina-token-buildkite-plugin/hooks/environment
```
````

#### With Line Highlighting

Use regex patterns to highlight specific content:

````markdown
```json title="example-resource-policy.json" /arn:.*-role/
{
  "Principal": {
    "AWS": ["arn:aws:iam::123456789012:role/chinmina-process-role"]
  }
}
```
````

#### D2 Diagrams

Use `d2 sketch=true` for diagrams:

````markdown
```d2 sketch=true title="sequence diagram showing authentication flow"
shape: sequence_diagram

buildkite-job: Buildkite Job
git: Git
credential-helper: Credential Helper

buildkite-job.clone -> git.auth: clone
git.auth -> credential-helper.req: get credentials
```
````

### Configuration Parameter Documentation

Use H6 headings with parameter names in backticks, followed by default value (if applicable) in italics:

```markdown
###### `SERVER_PORT`

_(default: `8080`)_

The port that the Chinmina service will bind to on startup.

###### `OBSERVE_ENABLED`

_(default: `false`)_

When `true`, Open Telemetry traces and metrics will be published on the
configured transport type.
```

### Frontmatter

All documentation pages must include frontmatter with title and description.

**Title formatting:** Use sentence case (capitalize only the first word and proper nouns), not title case.

**Good:**

- `title: Configuration`
- `title: Protecting the GitHub private key`
- `title: Getting started`

**Bad:**

- `title: Protecting The GitHub Private Key` (title case)
- `title: Getting Started` (title case)

```yaml
---
title: Configuration
description: Details of all configuration options available.
---
```

For splash/landing pages:

```yaml
---
title: Chinmina Bridge
description: Connect Buildkite to GitHub with secure, short-lived tokens.
template: splash
hero:
  tagline: Connect Buildkite to GitHub with secure, short-lived tokens.
  actions:
    - text: Getting Started
      link: /guides/getting-started
      icon: right-arrow
---
```

## Specific Patterns to Emulate

### Stub Acknowledgment

When content is incomplete, state it plainly:

```markdown
## Observability

This section is a stub. For now, refer to the `.envrc` file for details on the
environment variables that configure observability features.
```

### Footnotes for Tangential Information

Use standard Markdown footnotes:

```markdown
Controls are required to ensure that repository access is appropriately
limited.[^1]

[^1]:
    Changing this behaviour is a short-term goal. In upcoming releases,
    configuration will be required in order to enable repository access.
```

### Custom Components for Repetition

Define reusable inline components when a pattern repeats:

```jsx
{
  /* Shorthand component for a badge that indicates a value to be collected. */
}
export function Later({ name }) {
  return <Badge text={`📝 ${name}`} variant="tip" />
}
```

Then use it:

```mdx
Save as <Later name="GITHUB_APP_ID" />
```

### Honest About Limitations

Include dedicated sections for drawbacks and limitations. Don't minimize or hide them.

```markdown
## Drawbacks

Chinmina needs to be self-hosted alongside the Buildkite agent infrastructure.
It is a single point of failure in the system also, and critical to keep up.

The private key for the GitHub application is quite powerful, and needs to be
carefully protected.
```

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

## Summary Checklist

Before finalizing content, verify:

1. **Mode**: Am I writing a Guide (action) or Reference (facts)?
2. **Perspective**: Guides use "you" + imperative; Reference uses third person + declarative
3. **Structure**: Concepts follow Definition → Purpose → Mechanics
4. **Format**: Titles in sentence case; `<Steps>` and `<Aside>` imported if used
5. **Tone**: Guides "coach"; Reference "defines"
6. **Style**: Direct, concise, honest—no filler, hedging, or rhetorical questions

When in doubt, review existing documentation in this repository and match its patterns rather than defaulting to typical AI-generated prose.
