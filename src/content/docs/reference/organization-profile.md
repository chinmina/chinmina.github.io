---
title: Organization profiles
description: Details of what an organization profile is and how it is used.
---

Organization profiles are a way to facilitate cross-repository access for 
pipelines as well as managing the permissions provided by the tokens that
Chinmina Bridge creates.

If you are using Chinmina to manage Buildkite's access to GitHub, you will
need to use organization profiles in order to provide access to non-public
repositories. Examples where you may need to do this include accessing private
packages or releases, or loading Buildkite plugins from private repositories.

:::tip

To use an organization profile, you must provide the location of the profile in
the `GITHUB_ORG_PROFILE` environment variable, as well as request the profile 
in your request to Chinmina. If a profile is not specified, or if there is no
profile configured for the organization, Chinimina will instead default to
providing access to the repository that the pipeline is running in.

:::

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


### `organization`

The root element that contains all organization-related configurations.

### `profiles`

A list of profiles within the organization. Each profile must contain:

#### `name`

The name of the profile. This should be a unique identifier for the profile.

#### `repositories`

A list of repositories that the profile has access to. This list includes 
only the repository name and does not include the owner or organization name.

#### `permissions`

A list of permissions granted to the profile. These permissions are defined
in the [GitHub documentation for tokens][github-token-permissions].

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