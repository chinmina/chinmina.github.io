---
title: Organization profiles
description: Details of what an organization profile is and how it is used.
---

An organization profile defines repository access and permissions available to
all agents associated with the Buildkite organization.

The location of the organizational profile is configured via the
[`GITHUB_ORG_PROFILE`](../reference/configuration#github_org_profile)
environment variable.

Profile-related tokens are requested via separate URL paths. Tokens will not be
vended on these paths unless configuration is present.

Profiles are useful for a variety of use cases where low risk access is required by a wide set of repositories. For example:

- Accessing private packages or releases
- Loading Buildkite plugins from private repositories
- Cloning or reading multiple private repositories within a pipeline

# Organization Profile Structure

The organization profile is provided as a YAML file with structure as follows:

```yaml
organization:
  profiles:
    - name: "<profile-name>"
        repositories:
          - "<repository-name>"
        permissions: ["<permission>"]
```

## Fields

##### `organization`

The root element that contains all organization-related configurations.

##### `profiles`

A list of profiles within the organization. Each profile must contain:

###### `name`

The name of the profile. This should be a unique identifier for the profile.

###### `repositories`

A list of repositories that the profile has access to. This list includes
only the repository name and does not include the owner or organization name.

###### `permissions`

A list of permissions granted to the profile. See the [GitHub documentation for
tokens][github-token-permissions] for available permission values.

# Example

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
```

[github-token-permissions]: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token
