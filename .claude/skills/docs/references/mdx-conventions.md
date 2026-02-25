# MDX Technical Conventions

Implementation details for Astro Starlight: components, code blocks, frontmatter, and repo-specific patterns.

## Asides (Callouts)

Use `<Aside>` component or `:::directive` syntax for notes, tips, and cautions.

### With Component Import

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

### With Directive Syntax

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

## Steps Component

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

## Code Blocks

### Basic Code Block

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

### With Title

````markdown
```bash title="Execute plugin environment hook directly"
BUILDKITE_PLUGIN_CHINMINA_TOKEN_CHINMINA_URL="..." \
    source /buildkite/plugins/chinmina-token-buildkite-plugin/hooks/environment
```
````

### With Line Highlighting

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

### D2 Diagrams

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

## Configuration Parameter Documentation

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

## Frontmatter

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
