---
title: Profiles
description: Reference documentation for profile configuration.
---

:::note

Profiles are a core concept in Chinmina Bridge that enable **custom token
permissions and repository access** for Buildkite pipelines, expanding the
capabilities of tokens created by Chinmina while keeping the same expiration
guarantees as the default token.

:::

## Profile types

Two profile types are available:

- **[Pipeline profiles](pipeline)** - grant elevated permissions to the pipeline's own repository
- **[Organization profiles](organization)** - provide access to other repositories across the organization

## Configuration

Profiles are configured via a YAML file hosted in a GitHub repository. The
location is specified using the
[`GITHUB_ORG_PROFILE`](../configuration#github_org_profile) environment
variable.

The configuration file contains both profile types:

```yaml
pipeline:
  defaults:
    permissions: ["contents:read"]
  profiles:
    - name: "pr-commenter"
      permissions: ["contents:read", "pull_requests:write"]

organization:
  profiles:
    - name: "shared-plugins"
      repositories: ["plugin-1", "plugin-2"]
      permissions: ["contents:read"]
```

## Access control

Both profile types support [claim-based matching](matching) to restrict which pipelines can use a profile. Match rules evaluate JWT claims from the Buildkite OIDC token, enabling fine-grained authorization based on pipeline identity, branch, cluster, or agent tags.

## API access

Profiles are accessed via HTTP endpoints:

- Pipeline profiles: `/token/{profile}` and `/git-credentials/{profile}`
- Organization profiles: `/organization/token/{profile}` and `/organization/git-credentials/{profile}`

The special name `default` accesses pipeline default permissions.

## See also

- [Customizing token permissions guide](../../guides/customizing-permissions) - practical how-to for setting up and using profiles
- [Profile matching reference](matching) - match rule syntax and available claims
