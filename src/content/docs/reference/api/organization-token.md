---
title: POST /organization/token/{profile}
description: Profile-scoped token endpoint that returns GitHub tokens with profile-specific permissions.
---

The `POST /organization/token/{profile}` endpoint returns GitHub
installation tokens in JSON format, using token permissions granted by a
specified organization profile.

:::note

Use `/organization/git-credentials/{profile}` when integrating directly with
Git's credential helper system. Use `/organization/token/{profile}` when you need token metadata, are
making direct API calls, or want more flexible response handling.

:::

### See also

- [Buildkite integration guide](../../guides/buildkite-integration) for details
  on how this endpoint is used in practice.
- [Customizing token permissions guide](../../guides/customizing-permissions) for
  practical setup and usage instructions.

## Purpose

This endpoint provides explicit control over which organization profile is used
when vending GitHub tokens. Profiles allow configuring different sets of
repositories and permissions for different use cases.

## Request format

### Headers

| Header          | Required | Description                 |
| --------------- | -------- | --------------------------- |
| `Authorization` | Yes      | Bearer token containing JWT |
| `Content-Type`  | Yes      | `application/json`          |

## Parameters

### Profile parameter

The `{profile}` path parameter specifies which organization profile to use. Profile names are used directly without prefixes.

Examples:

- `POST /organization/token/deploy`
- `POST /organization/token/package-registry`
- `POST /organization/token/buildkite-plugin`

The API does not use prefixes. Prefixes like `org:` are part of the plugin interface only and are translated by the plugins to the appropriate API paths.

### Request body

The request body is expected to be empty.

## Response format

### Success response (200 OK)

```json
{
  "organizationSlug": "my-org",
  "profile": "release-publisher",
  "repositoryUrl": "",
  "repositories": { "names": ["owner/release-tools", "owner/shared-infra"] },
  "permissions": ["metadata:read", "contents:write", "packages:write"],
  "token": "ghs_...",
  "hashedToken": "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
  "expiry": "2025-12-21T10:00:00Z"
}
```

For wildcard profiles (configured with `repositories: ["*"]`), the `repositories` field is `{"wildcard": true}` rather than a named list.

| Field              | Type   | Description                                                                                                                                                                                       |
| ------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `organizationSlug` | string | Buildkite organization from JWT claims                                                                                                                                                            |
| `profile`          | string | Profile identifier that was used                                                                                                                                                                  |
| `repositoryUrl`    | string | Always empty for organization profile requests                                                                                                                                                    |
| `repositories`     | object | Repositories the token has access to. Either `{"wildcard": true}` (all repositories accessible to the GitHub App installation) or `{"names": ["owner/repo", ...]}` (specific named repositories). |
| `permissions`      | array  | Permissions granted. Always includes `metadata:read` plus configured permissions.                                                                                                                 |
| `token`            | string | GitHub installation token (format: `ghs_...`)                                                                                                                                                     |
| `hashedToken`      | string | SHA-256 hash of the token, base64-encoded (`base64(SHA-256(token))`). Use to correlate with [GitHub organisation audit log events][gh-audit-token] for the same token.                            |
| `expiry`           | string | ISO 8601 timestamp when token expires                                                                                                                                                             |

### Empty response (200 OK)

When the requested repository is not in the profile's repository list, the endpoint returns a successful empty response. This allows credential helpers to fall through to other authentication methods.

## Error responses

| Status code      | Condition                     | Response   |
| ---------------- | ----------------------------- | ---------- |
| 400 Bad Request  | Invalid profile format        | JSON error |
| 401 Unauthorized | Missing or invalid JWT        | JSON error |
| 403 Forbidden    | Insufficient JWT claims       | JSON error |
| 404 Not Found    | Profile does not exist        | JSON error |
| 500 Server Error | Token vending or GitHub error | JSON error |

[gh-audit-token]: https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/identifying-audit-log-events-performed-by-an-access-token
