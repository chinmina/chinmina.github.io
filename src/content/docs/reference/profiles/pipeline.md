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

###### `permissions`

List of GitHub permissions. The `metadata:read` permission is [automatically included](../profiles#automatic-permissions) in all tokens. See the [GitHub documentation for tokens][github-token-permissions] for available permission values.

##### `profiles`

A list of named pipeline profiles available for pipelines to request.

###### `name`

Profile identifier used in API requests. The name `default` is reserved and cannot be used for a custom profile.

###### `match`

_(optional)_

Claim matching rules that restrict which pipelines can use this profile. Omit this field entirely to make the profile available to all pipelines.

See the [profile matching reference](matching) for complete details on:
- Match rule syntax (exact vs regex matching)
- Available claims
- Pattern examples
- Troubleshooting

###### `permissions`

GitHub permissions granted by this profile. The `metadata:read` permission is [automatically included](../profiles#automatic-permissions) in all tokens.

### Example

```yaml
pipeline:
  defaults:
    permissions: ["contents:read"]

  profiles:
    # Allow any pipeline to comment on PRs
    - name: "pr-commenter"
      permissions: ["contents:read", "pull_requests:write"]

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
  - GITHUB_TOKEN=pipeline:default       # pipeline defaults
  - PR_TOKEN=pipeline:pr-commenter      # named pipeline profile
```

The plugins translate these to appropriate API paths (`/token/default`, `/token/pr-commenter`).

[github-token-permissions]: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token
[chinmina-token]: https://github.com/chinmina/chinmina-token-buildkite-plugin
[credentials-plugin]: https://github.com/chinmina/chinmina-git-credentials-buildkite-plugin
