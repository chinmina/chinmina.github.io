---
title: POST /organization/git-credentials/{profile}
description: Profile-scoped Git credential helper endpoint that returns GitHub tokens for a specific organization profile.
---

The `POST /organization/git-credentials/{profile}` endpoint returns GitHub
installation tokens in Git's [credential helper format][helper-protocol], using
token permissions granted by a specified organization profile.

## Purpose

This endpoint provides explicit control over which organization profile is used
when vending GitHub tokens. Profiles allow configuring different sets of
repositories and permissions for different use cases.

This endpoint serves the same underlying function as [POST
/organization/token/{profile}](./organization-token) (vending GitHub installation
tokens), however its request and response format follows Git's [credential
helper protocol][helper-protocol]. This allows Chinmina Bridge to act as a Git
credential helper, enabling transparent authentication for Git operations
without requiring separate credential extraction and configuration steps.

:::note

Use `/organization/git-credentials/{profile}` when integrating directly with
Git's credential helper system. Use `/organization/token/{profile}` when you
need token metadata, are making direct API calls, or want more flexible response
handling.

:::

### See also

- [Buildkite integration guide](../../guides/buildkite-integration) for details
  on how this endpoint is used in practice.
- [Customizing token permissions guide](../../guides/customizing-permissions) for
  practical setup and usage instructions.

## Request format

### Headers

| Header          | Required    | Description                                |
| --------------- | ----------- | ------------------------------------------ |
| `Authorization` | Yes         | Bearer token containing Buildkite OIDC JWT |
| `Content-Type`  | Recommended | Should be `text/plain`                     |

## Parameters

### Profile parameter

The `{profile}` path parameter specifies which organization profile to use. Profile names are used directly without prefixes.

Examples:
- `POST /organization/git-credentials/deploy`
- `POST /organization/git-credentials/package-registry`
- `POST /organization/git-credentials/buildkite-plugin`

The API does not use prefixes. Prefixes like `org:` are part of the plugin interface only and are translated by the plugins to the appropriate API paths.

### Request body

The request body follows Git's credential helper input format:

```text
protocol=https
host=github.com
path=owner/repository
```

## Response format

### Success response (200 OK)

When a token is successfully vended:

```text
username=x-access-token
password=ghs_...
password_expiry_utc=1705320600
```

The response body is plain text with newline-separated key-value pairs. Git parses this and uses the credentials for the requested operation.

### Empty response (200 OK)

When the requested repository is not in the profile's allowed repository list, the endpoint returns a successful but empty response. See [Git credentials format](../git-credentials-format#empty-response) for details. This allows Git credential helpers to fall through to other credential sources.

### Error responses

| Status code               | Condition                               | Response body      |
| ------------------------- | --------------------------------------- | ------------------ |
| 400 Bad Request           | Invalid profile format or parameter     | JSON error message |
| 401 Unauthorized          | Missing or invalid JWT                  | JSON error message |
| 403 Forbidden             | JWT valid but claims insufficient       | JSON error message |
| 404 Not Found             | Profile does not exist                  | JSON error message |
| 500 Internal Server Error | Token vending failure, GitHub API error | JSON error message |

Error responses are returned in JSON format. Any response that Git does not recognize as valid for the format is regarded as an error and discarded.

[helper-protocol]: ../git-credentials-format
