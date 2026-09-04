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

- [Buildkite integration guide](/guides/buildkite-integration) for details
  on how this endpoint is used in practice.
- [Customizing token permissions guide](/guides/customizing-permissions) for
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

### Repository scope parameter

For profiles configured with `repositories: ["{{caller-scoped-repository}}"]`
(see [caller-scoped repositories](/reference/profiles/organization#caller-scoped-repositories)),
the target repository is supplied via the `repository-scope` query parameter:

```text
POST /organization/token/agent-pr?repository-scope=widget
```

Supplying `repository-scope` for a profile that is not caller-scoped, or
omitting it for one that is, returns `400 Bad Request`.

### Request body

The request body is expected to be empty.

## Response format

### Success response (200 OK)

```json
{
  "organizationSlug": "my-org",
  "profile": "org:release-publisher",
  "repositoryUrl": "",
  "repositories": { "names": ["owner/release-tools", "owner/shared-infra"] },
  "permissions": ["metadata:read", "contents:write", "packages:write"],
  "app": "packages",
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
| `app`              | string | Name of the GitHub App the token was created through. `default` when the default app is used. See [using multiple GitHub Apps](/guides/multiple-github-apps).                                      |
| `token`            | string | GitHub installation token (format: `ghs_...`)                                                                                                                                                     |
| `hashedToken`      | string | SHA-256 hash of the token, base64-encoded (`base64(SHA-256(token))`). Use to correlate with [GitHub organisation audit log events][gh-audit-token] for the same token.                            |
| `expiry`           | string | ISO 8601 timestamp when token expires                                                                                                                                                             |

`appId` and `installationId` are included only when [`DEV_DISCLOSE_APP_IDENTIFIERS`](/reference/configuration#dev_disclose_app_identifiers)
is set, a development-only setting.

### Empty response (200 OK)

When the requested repository is not in the profile's repository list, the endpoint returns a successful empty response. This allows credential helpers to fall through to other authentication methods.

## Error responses

| Status code      | Condition                                                                                                                                         | Response   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 400 Bad Request  | Invalid profile format, or repository-scope missing/unexpected/malformed                                                                          | JSON error |
| 401 Unauthorized | Missing or invalid JWT                                                                                                                            | JSON error |
| 403 Forbidden    | Insufficient JWT claims, or GitHub rejected a caller-scoped repository                                                                            | JSON error |
| 404 Not Found    | Profile does not exist, or is unavailable because it failed validation (for example, it names a GitHub App that is not configured or is disabled) | JSON error |
| 500 Server Error | Token vending error, GitHub error, or the profile names a GitHub App that could not be resolved                                                   | JSON error |

A profile that failed validation returns
`{"error": "profile unavailable: validation failed"}`. The cause is recorded
only in the [audit log](/reference/auditing).

[gh-audit-token]: https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/identifying-audit-log-events-performed-by-an-access-token
