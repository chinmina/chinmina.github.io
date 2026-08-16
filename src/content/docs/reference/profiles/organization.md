---
title: Organization profiles
description: Details of what an organization profile is and how it is used.
---

An organization profile defines sets of repository access and permissions available to agents associated with the Buildkite organization, optionally restricted to specific pipelines via match rules.

The location of the profile configuration file is specified via the [`GITHUB_ORG_PROFILE`](/reference/configuration#github_org_profile) environment variable.

Profile-related tokens are requested via separate URL paths. Tokens will not be vended on these paths unless configuration is present.

Profiles are useful for a variety of use cases where low-risk access is required by a wide set of repositories. For example:

- Accessing private packages or releases
- Loading Buildkite plugins from private repositories
- Cloning or reading multiple private repositories within a pipeline

## Organization profile structure

The profile configuration file is provided as YAML with both organization and pipeline profile sections:

```yaml
organization:
  profiles:
    - name: "<profile-name>"
      match: # Optional: restricts which pipelines can use this profile
        - claim: "<claim-name>"
          value: "<exact-value>" # OR
          valuePattern: "<regex>" # One of value/valuePattern required
      repositories:
        - "<repository-name>"
      permissions: ["<permission>"]

pipeline:
  defaults:
    permissions: ["<permission>"]
  profiles:
    - name: "<profile-name>"
      # ... see pipeline profile reference
```

### Fields

##### `organization`

The root element that contains all organization-related configurations.

##### `profiles`

A list of profiles within the organization. Each profile must contain:

###### `name`

The name of the profile. This should be a unique identifier for the profile.

###### `match`

_(optional)_

Claim matching rules that restrict which pipelines can use this profile. Omit this field entirely to make the profile available to all pipelines.

See the [profile matching reference](/reference/profiles/matching) for complete details on:

- Match rule syntax (exact vs regex matching)
- Available claims
- Pattern examples
- Troubleshooting

###### `repositories`

The repositories the profile grants access to. One of:

- A list of repository names (owner/organization omitted), e.g. `["release-tools", "shared-infra"]`
- `{{all-repositories}}`, granting access to every repository the GitHub App
  installation can reach.
- `{{caller-scoped-repository}}`, narrowing the token to a single repository
  named by the caller at request time (see [caller-scoped
  repositories](#caller-scoped-repositories) below)

A literal (`{{all-repositories}}`, `{{caller-scoped-repository}}`, or `*`)
must be the only entry in the list; it cannot be combined with named
repositories.

::::caution[Deprecated `*` wildcard]

The bare `*` wildcard is a deprecated alias for `{{all-repositories}}`. It
still works and emits a startup warning; it will be removed in the future v1
release. Migrate existing profiles to `{{all-repositories}}`.

::::

###### `permissions`

A list of permissions granted to the profile. The `metadata:read` permission is [automatically included](/reference/profiles#automatic-permissions) in all tokens. See the [GitHub documentation for tokens][github-token-permissions] for available permission values.

### Example

```yaml
organization:
  profiles:
    # allow read access to a set of buildkite-plugins
    - name: "buildkite-plugin"
      # array of repos accessible to the profile
      repositories:
        - somewhat-private-buildkite-plugin
        - very-private-buildkite-plugin
      permissions: ["contents:read"]

    # allow package access to any repository
    - name: "package-registry"
      repositories: ["{{all-repositories}}"]
      permissions: ["packages:read"]

    # let a shared CI pipeline open PRs against any repository it names
    - name: "agent-pr"
      repositories: ["{{caller-scoped-repository}}"]
      permissions: ["contents:write", "pull_requests:write"]

    # allow write access only for release pipelines on main branch
    - name: "release-publisher"
      match:
        - claim: pipeline_slug
          valuePattern: ".*-release"
        - claim: build_branch
          value: "main"
      repositories: ["release-tools", "shared-infra"]
      permissions: ["contents:write", "packages:write"]

pipeline:
  defaults:
    permissions: ["contents:read"]
```

## Accessing organization profiles

Organization profiles are requested via:

- `/organization/token/{profile}` for JSON token responses
- `/organization/git-credentials/{profile}` for Git credential helper format

### From Buildkite plugins

The [Chinmina Token plugin][chinmina-token] and [Chinmina Git Credentials plugin][credentials-plugin] use the `org:` prefix to identify organization profiles:

```yaml
environment:
  - PACKAGES_TOKEN=org:package-registry
  - PLUGINS_TOKEN=org:buildkite-plugin
```

The plugins translate these to appropriate API paths (`/organization/token/package-registry`, etc.).

## Caller-scoped repositories

A profile with `repositories: ["{{caller-scoped-repository}}"]` does not
store a fixed repository list. Instead, the caller names a single target
repository per request, and the vended token is narrowed to it — useful for
workflows (e.g. AI coding agents) that operate against a different
repository each run without needing one profile per repository.

**`/organization/token/{profile}`** takes the target repository via the
`repository-scope` query parameter:

```text
POST /organization/token/agent-pr?repository-scope=widget
```

**`/organization/git-credentials/{profile}`** derives the target repository
from the Git remote URL in the request body, with no extra parameter
required.

Validation is strict and bidirectional:

- Supplying `repository-scope` to a profile that isn't caller-scoped returns
  `400 Bad Request`.
- Omitting `repository-scope` (and, for `/organization/token`, having no
  resolvable repository) on a caller-scoped profile returns `400 Bad
Request`.
- A scope value containing `/`, whitespace, or control characters returns
  `400 Bad Request`; it is otherwise used verbatim (not normalized) as the
  repository name and cache key.
- If GitHub rejects the resulting token request — for example, the named
  repository doesn't exist or isn't in the installation — the response is a
  generic `403 Forbidden`, never a `404`, so the response never reveals
  whether a repository exists.

## See also

For permissions scoped to the pipeline's own repository, see [pipeline profiles](/reference/profiles/pipeline).

[github-token-permissions]: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token
[chinmina-token]: https://github.com/chinmina/chinmina-token-buildkite-plugin
[credentials-plugin]: https://github.com/chinmina/chinmina-git-credentials-buildkite-plugin
