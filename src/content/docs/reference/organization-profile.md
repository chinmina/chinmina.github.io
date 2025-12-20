---
title: Organization profiles
description: Details of what an organization profile is and how it is used.
---

An organization profile defines sets of repository access and permissions available to
agents associated with the Buildkite organization, optionally restricted to specific
pipelines via match rules.

The location of the organizational profile is configured via the
[`GITHUB_ORG_PROFILE`](../reference/configuration#github_org_profile)
environment variable.

Profile-related tokens are requested via separate URL paths. Tokens will not be
vended on these paths unless configuration is present.

Profiles are useful for a variety of use cases where low-risk access is required
by a wide set of repositories. For example:

- Accessing private packages or releases
- Loading Buildkite plugins from private repositories
- Cloning or reading multiple private repositories within a pipeline

## Organization profile structure

The organization profile is provided as a YAML file with structure as follows:

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

A list of conditions that must all be satisfied (AND logic) for a pipeline to use this
profile. If omitted or empty, the profile is available to all pipelines.

Each match rule must specify:

- `claim`: The JWT claim name to match against (see allowed claims below)
- `value`: Exact string match, OR
- `valuePattern`: RE2 regex pattern (automatically anchored for full-string matching)

###### `repositories`

A list of repositories that the profile has access to. This list includes
only the repository name and does not include the owner or organization name.

###### `permissions`

A list of permissions granted to the profile. See the [GitHub documentation for
tokens][github-token-permissions] for available permission values.

### Allowed claims for matching

The following JWT claims can be used in match rules:

| Claim                        | Description                                  |
| ---------------------------- | -------------------------------------------- |
| `pipeline_slug`              | Pipeline's slug                              |
| `pipeline_id`                | Pipeline UUID                                |
| `build_number`               | Build number (as string)                     |
| `build_branch`               | Git branch name                              |
| `build_tag`                  | Git tag (if present)                         |
| `build_commit`               | Git commit SHA                               |
| `cluster_id`, `cluster_name` | Cluster identifiers                          |
| `queue_id`, `queue_key`      | Queue identifiers                            |
| `agent_tag:NAME`             | Dynamic agent tags (e.g., `agent_tag:queue`) |

:::tip

See the [profile access control guide](../guides/profile-access-control) for use cases,
pattern examples, and troubleshooting.

:::

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
```

[github-token-permissions]: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token
