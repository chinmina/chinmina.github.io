# Formatting and Structure

Prose-level decisions: choosing between lists and paragraphs, sentence structure, and inline formatting conventions.

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

## "As You Go" Collection Pattern

Multi-step guides that require collecting values (API keys, IDs, configuration parameters) across steps should use a collection convention:

1. **Introduce the convention early.** Add a short section near the top of the guide explaining that values will be marked for collection as the reader proceeds.
2. **Use a visual marker** at the point where each value is produced, so the reader knows to save it.
3. **Name markers after the configuration parameter** the value maps to, connecting the setup step directly to the deployment configuration.

**Example introduction:**

```mdx
## As you go

Values to save for required configuration are marked in the instructions below
like this: <Later name="ENV_VAR_NAME" />.

Collect these values as you proceed so they can be provided for your
installation's configuration.
```

**Example usage in a step:**

```mdx
Create an API key with access to the REST API **only** with access to the
`read_pipelines` scope. Save as <Later name="BUILDKITE_API_TOKEN" />.
```

The `Later` component itself is defined as a custom inline component (see [MDX conventions](./mdx-conventions.md#custom-components-for-repetition)).

This pattern keeps procedural guides self-contained: the reader finishes the guide with all the values they need, without backtracking.

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
