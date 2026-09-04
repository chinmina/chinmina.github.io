---
title: POST /token/{profile}
description: API reference for the token vending endpoint that returns short-lived GitHub installation tokens.
---

The `POST /token/{profile}` (and legacy `POST /token`)
endpoints vend short-lived GitHub installation tokens validated against
Buildkite OIDC tokens.

The profile parameter selects the pipeline profile that will be used when
creating the token using permissions defined by the specified [pipeline
profile](/reference/profiles/pipeline).

The reserved profile name `default` is always available. The default profile can
be requested via `POST /token/default` or `POST /token`.
Permissions for the `default` profile [can be
changed](/reference/profiles/pipeline#defaults) but `match` rules cannot be added.

## Purpose

This endpoint returns GitHub installation tokens in JSON format. Use `/token`
when you need token metadata, are making direct API calls, or want more flexible
response handling.

For Git credential helper integration, use the [`POST
/git-credentials`](/reference/api/pipeline-git-credentials) endpoint instead, which returns tokens in
Git's credential helper format.

:::note

Both `/token` and `/git-credentials` vend the same underlying GitHub
installation tokens. Choose the endpoint based on your integration method:
`/token` for JSON responses, `/git-credentials` for Git credential helper
protocol.

:::

## Request format

### Headers

| Header          | Required | Description                                |
| --------------- | -------- | ------------------------------------------ |
| `Authorization` | Yes      | Bearer token containing Buildkite OIDC JWT |
| `Content-Type`  | Yes      | Must be `application/json`                 |

### Profile parameter

The optional `{profile}` path parameter specifies which pipeline profile to use:

- `/token` (no parameter): Uses pipeline default permissions
- `/token/default`: Same as `/token` (explicitly requests default permissions)
- `/token/{profile-name}`: Uses the named pipeline profile

Profile names are used directly in the path. The API does not use prefixes
(prefixes like `pipeline:` are part of the plugin interface only).

Examples:

- `POST /token` → default pipeline permissions
- `POST /token/pr-commenter` → "pr-commenter" pipeline profile
- `POST /token/release` → "release" pipeline profile

If the profile does not exist or the pipeline doesn't match the profile's access
rules, the request returns an error.

### Request body

The request body is expected to be empty.

## Response format

### Success response (200 OK)

When a token is successfully vended, the response is a JSON object:

```json
{
  "organizationSlug": "my-org",
  "profile": "repo:default",
  "repositoryUrl": "https://github.com/owner/repository",
  "repositories": { "names": ["owner/repository"] },
  "permissions": ["metadata:read", "contents:read"],
  "app": "default",
  "token": "ghs_...",
  "hashedToken": "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
  "expiry": "2025-12-21T10:00:00Z"
}
```

| Field              | Type   | Description                                                                                                                                                                                       |
| ------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `organizationSlug` | string | Buildkite organization from JWT claims                                                                                                                                                            |
| `profile`          | string | Profile identifier that was used                                                                                                                                                                  |
| `repositoryUrl`    | string | The URL of the pipeline's repository, which the token was created for                                                                                                                             |
| `repositories`     | object | Repositories the token has access to. Either `{"wildcard": true}` (all repositories accessible to the GitHub App installation) or `{"names": ["owner/repo", ...]}` (specific named repositories). |
| `permissions`      | array  | Permissions granted. Always includes `metadata:read` plus configured permissions.                                                                                                                 |
| `app`              | string | Name of the GitHub App the token was created through. `default` when the default app is used. See [using multiple GitHub Apps](/guides/multiple-github-apps).                                      |
| `token`            | string | GitHub installation token (format: `ghs_...`)                                                                                                                                                     |
| `hashedToken`      | string | SHA-256 hash of the token, base64-encoded (`base64(SHA-256(token))`). Use to correlate with [GitHub organisation audit log events][gh-audit-token] for the same token.                            |
| `expiry`           | string | ISO 8601 timestamp when token expires                                                                                                                                                             |

`appId` and `installationId` are included only when [`DEV_DISCLOSE_APP_IDENTIFIERS`](/reference/configuration#dev_disclose_app_identifiers)
is set, a development-only setting.

### Error responses

| Status code                    | Condition                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `401 Unauthorized`             | Missing or invalid JWT                                                                                                                            |
| `403 Forbidden`                | Pipeline doesn't match profile's access rules                                                                                                     |
| `404 Not Found`                | Profile does not exist, or is unavailable because it failed validation (for example, it names a GitHub App that is not configured or is disabled) |
| `413 Request Entity Too Large` | Request body exceeds 20 KB                                                                                                                        |
| `500 Internal Server Error`    | Token vending failure, Buildkite API error, GitHub API error, or the profile names a GitHub App that could not be resolved                        |

A profile that failed validation returns
`{"error": "profile unavailable: validation failed"}`. The cause is recorded
only in the [audit log](/reference/auditing).

[gh-audit-token]: https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/identifying-audit-log-events-performed-by-an-access-token
