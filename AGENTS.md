# Writing Guide for AI Agents

This document guides AI agents in producing documentation that matches the existing voice and style of this repository, avoiding typical LLM-generated patterns.

## Tone and Voice

### Register: Technical-Professional

The documentation assumes a knowledgeable reader (DevOps engineers, platform engineers) but does not assume prior knowledge of this specific system. Technical terms are used directly without over-explanation.

**Example:**
> "Chinmina Bridge is a simple web service that acts as an intermediary between a Buildkite installation and a related GitHub App."

### Perspective: Second Person and Imperative

Use second person ("you") for explanations and setup guidance. Use imperative mood for instructions. Never use first person ("I" or "we").

**Good:**
- "Before you start, there are a few things you'll need to have:"
- "Create an API key with access to the REST API."
- "Run `direnv allow` to bring the updated configuration into the environment."

**Bad:**
- "We will now explore how to set up the service..."
- "Let's create an API key together..."
- "I recommend that you consider using..."

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

### Introducing Concepts

Follow this pattern: **what it is** → **why it exists** → **how it works**

**Example:**
> "Audit logs provide a level of non-repudiation for the system. These logs are written to the container's stdout, and cannot be disabled."
>
> First sentence: what it provides (purpose).
> Second sentence: how it behaves (mechanics).

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
{/* Shorthand component for a badge that indicates a value to be collected. */}
export function Later({ name }) {
  return <Badge text={`📝 ${name}`} variant="tip" />;
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
├── introduction.md              # Overview
├── guides/                      # How-to guides
│   ├── getting-started.mdx
│   ├── kms.mdx
│   └── observability.md
├── reference/                   # Reference documentation
│   └── configuration.md
└── contributing/                # Contributor guides
    └── development.mdx
```

## Summary

Write documentation that is:

1. **Direct** - No filler, hedging, or rhetorical questions
2. **Concise** - Short paragraphs and sentences
3. **Honest** - Clear about limitations and drawbacks
4. **Instructive** - Imperative verbs for actions, second person for context
5. **Technical** - Assumes knowledgeable readers, uses precise terminology
6. **Structured** - Lists for procedures and options, prose for concepts
7. **Formatted consistently** - Bold for emphasis, code for values, reference links

When in doubt, review existing documentation in this repository and match its patterns rather than defaulting to typical AI-generated prose.
