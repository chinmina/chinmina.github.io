---
title: Pipeline profiles
description: Configure permissions for tokens scoped to pipeline repositories.
---

Pipeline profiles define permission sets that pipelines can request for their own repository. Unlike organization profiles, pipeline profiles do not specify repositories; tokens are always scoped to the requesting pipeline's associated repository.

## Pipeline profile structure

```yaml
pipeline:
  defaults:
    permissions: ["contents:read", "pull_requests:read"]
  profiles:
    - name: "pr-commenter"
      app: "<app-name>" # Optional: the GitHub App tokens are created through
      match: # Optional claim matching
        - claim: "pipeline_slug"
          valuePattern: ".*"
      permissions: ["contents:read", "pull_requests:write"]
```

### Fields

##### `pipeline`

Root element for pipeline profile configuration.

##### `defaults`

Default permissions applied to all pipeline token requests when no profile is specified. Requests to `/token` or `/git-credentials` (without a profile name) receive these permissions.

The `app` field is not accepted here. Default tokens are always created through
the default app, and an `app` key under `defaults` fails parsing of the whole
profile configuration file.

###### `permissions`

List of GitHub permissions. The `metadata:read` permission is [automatically included](/reference/profiles#automatic-permissions) in all tokens. See the [GitHub documentation for tokens][github-token-permissions] for available permission values.

##### `profiles`

A list of named pipeline profiles available for pipelines to request.

###### `name`

Profile identifier used in API requests. The name `default` is reserved and cannot be used for a custom profile.

###### `app`

Optional. The name of a GitHub App registered with
[`GITHUB_APPS`](/reference/configuration#github_apps). Omitted, or set to
`default`, creates the profile's tokens through the default app.

An empty value, or a name that is not a configured, enabled app, makes the
profile invalid: requests for it return `404`.

See [using multiple GitHub Apps](/guides/multiple-github-apps).

###### `match`

Optional claim matching rules that restrict which pipelines can use this
profile. Omit this field entirely to make the profile available to all
pipelines.

See the [profile matching reference](/reference/profiles/matching) for complete details on:

- Match rule syntax (exact vs regex matching)
- Available claims
- Pattern examples
- Troubleshooting

###### `permissions`

GitHub permissions granted by this profile. The `metadata:read` permission is [automatically included](/reference/profiles#automatic-permissions) in all tokens.

### Example

```yaml
pipeline:
  defaults:
    permissions: ["contents:read"]

  profiles:
    # Allow any pipeline to comment on PRs
    - name: "pr-commenter"
      permissions: ["contents:read", "pull_requests:write"]

    # Push container images using a dedicated GitHub App
    - name: "build-images"
      app: packages
      permissions: ["contents:read", "packages:write"]

    # Only main branch can publish releases
    - name: "release-publisher"
      match:
        - claim: build_branch
          value: "main"
      permissions: ["contents:write"]

    # Restricted to specific pipelines
    - name: "deployment"
      match:
        - claim: pipeline_slug
          valuePattern: ".*-prod"
        - claim: build_branch
          value: "main"
      permissions: ["contents:write", "deployments:write"]
```

## Accessing pipeline profiles

Pipeline profiles are requested via:

- `/token/{profile}` for JSON token responses
- `/git-credentials/{profile}` for Git credential helper format

The special profile name `default` accesses `pipeline.defaults` permissions.

### From Buildkite plugins

The [Chinmina Token plugin][chinmina-token] and [Chinmina Git Credentials plugin][credentials-plugin] use the `pipeline:` prefix to identify pipeline profiles:

```yaml
environment:
  - GITHUB_TOKEN=pipeline:default # pipeline defaults
  - PR_TOKEN=pipeline:pr-commenter # named pipeline profile
```

The plugins translate these to appropriate API paths (`/token/default`, `/token/pr-commenter`).

[github-token-permissions]: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token
[chinmina-token]: https://github.com/chinmina/chinmina-token-buildkite-plugin
[credentials-plugin]: https://github.com/chinmina/chinmina-git-credentials-buildkite-plugin
