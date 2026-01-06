---
title: Organization profiles
description: Details of what an organization profile is and how it is used.
---

An organization profile defines sets of repository access and permissions available to agents associated with the Buildkite organization, optionally restricted to specific pipelines via match rules.

The location of the profile configuration file is specified via the [`GITHUB_ORG_PROFILE`](../configuration#github_org_profile) environment variable.

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

See the [profile matching reference](matching) for complete details on:
- Match rule syntax (exact vs regex matching)
- Available claims
- Pattern examples
- Troubleshooting

###### `repositories`

A list of repositories that the profile has access to. This list includes only the repository name and does not include the owner or organization name.

###### `permissions`

A list of permissions granted to the profile. The `metadata:read` permission is [automatically included](../profiles#automatic-permissions) in all tokens. See the [GitHub documentation for tokens][github-token-permissions] for available permission values.

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
      # '*' indicates all, when specified must be only value. No other wildcards supported.
      repositories: ["*"]
      permissions: ["packages:read"]

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

## See also

For permissions scoped to the pipeline's own repository, see [pipeline profiles](pipeline).

[github-token-permissions]: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token
[chinmina-token]: https://github.com/chinmina/chinmina-token-buildkite-plugin
[credentials-plugin]: https://github.com/chinmina/chinmina-git-credentials-buildkite-plugin
