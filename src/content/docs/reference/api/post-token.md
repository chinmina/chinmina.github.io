---
title: POST /token
description: API reference for the token vending endpoint that returns short-lived GitHub installation tokens.
---

The `POST /token` endpoint vends short-lived GitHub installation tokens validated against Buildkite OIDC tokens. The endpoint operates in two modes: default mode (automatic pipeline repository detection) and profile mode (custom permission scopes and multi-repository access).

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
  "permissions": ["contents:read"],
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
| `permissions`      | array  | Permissions granted (e.g., `["contents:read", "packages:write"]`)       |
| `token`            | string | GitHub installation token (format: `ghs_...`)                           |
| `expiry`           | string | ISO 8601 timestamp when token expires                                   |

### Error responses

| Status code                    | Condition                                                     |
| ------------------------------ | ------------------------------------------------------------- |
| `401 Unauthorized`             | Missing or invalid JWT                                        |
| `413 Request Entity Too Large` | Request body exceeds 20 KB                                    |
| `500 Internal Server Error`    | Token vending failure, profile not found, or GitHub API error |
