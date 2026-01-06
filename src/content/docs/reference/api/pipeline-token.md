---
title: POST /token/{profile}
description: API reference for the token vending endpoint that returns short-lived GitHub installation tokens.
---

The `POST /token/{profile}` (and legacy `POST /token`)
endpoints vend short-lived GitHub installation tokens validated against
Buildkite OIDC tokens.

The profile parameter selects the pipeline profile that will be used when
creating the token using permissions defined by the specified [pipeline
profile](../profiles/pipeline).

The reserved profile name `default` is always available. The default profile can
be requested via `POST /token/default` or `POST /token`.
Permissions for the `default` profile [can be
changed](../profiles/pipeline#default) but `match` rules cannot be added.

## Purpose

This endpoint returns GitHub installation tokens in JSON format. Use `/token`
when you need token metadata, are making direct API calls, or want more flexible
response handling.

For Git credential helper integration, use the [`POST
/git-credentials`](git-credentials.md) endpoint instead, which returns tokens in
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
  "profile": "org:default",
  "repositoryUrl": "https://github.com/owner/repository",
  "repositories": ["owner/repository"],
  "permissions": ["metadata:read", "contents:read"],
  "token": "ghs_...",
  "expiry": "2025-12-21T10:00:00Z"
}
```

| Field              | Type   | Description                                                             |
| ------------------ | ------ | ----------------------------------------------------------------------- |
| `organizationSlug` | string | Buildkite organization from JWT claims                                  |
| `profile`          | string | Profile identifier that was used                                        |
| `repositoryUrl`    | string | The requested repository URL: this will always be empty                 |
| `repositories`     | array  | List of repository names the token has access to (format: `owner/repo`) |
| `permissions`      | array  | Permissions granted. Always includes `metadata:read` plus configured permissions. |
| `token`            | string | GitHub installation token (format: `ghs_...`)                           |
| `expiry`           | string | ISO 8601 timestamp when token expires                                   |

### Error responses

| Status code                    | Condition                                                       |
| ------------------------------ | --------------------------------------------------------------- |
| `401 Unauthorized`             | Missing or invalid JWT                                          |
| `403 Forbidden`                | Pipeline doesn't match profile's access rules                   |
| `404 Not Found`                | Profile does not exist or failed validation                     |
| `413 Request Entity Too Large` | Request body exceeds 20 KB                                      |
| `500 Internal Server Error`    | Token vending failure, Buildkite API error, or GitHub API error |
