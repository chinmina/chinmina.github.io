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
/organization/token/{profile}](/reference/api/organization-token) (vending GitHub installation
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

- [Buildkite integration guide](/guides/buildkite-integration) for details
  on how this endpoint is used in practice.
- [Customizing token permissions guide](/guides/customizing-permissions) for
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

### Repository scope

For profiles configured with `repositories: ["{{caller-scoped-repository}}"]`
(see [caller-scoped repositories](/reference/profiles/organization#caller-scoped-repositories)),
the target repository is derived automatically from the `path` field in the
request body — no extra parameter is needed. If the body doesn't resolve to a
repository, the request returns `400 Bad Request`.

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
protocol=https
host=github.com
path=owner/repository
username=x-access-token
password=ghs_...
password_expiry_utc=1705320600
```

The response body is plain text with newline-separated key-value pairs. Git parses this and uses the credentials for the requested operation. The `protocol`, `host` and `path` lines echo the request.

With [`DEV_DISCLOSE_APP_IDENTIFIERS`](/reference/configuration#dev_disclose_app_identifiers)
set, the response also carries `chinmina_app_name`, `chinmina_app_id` and
`chinmina_installation_id`. See [development
properties](/reference/git-credentials-format#development-properties). This
setting is for development only.

### Empty response (200 OK)

When the requested repository is not in the profile's allowed repository list, the endpoint returns a successful but empty response. See [Git credentials format](/reference/git-credentials-format#empty-response) for details. This allows Git credential helpers to fall through to other credential sources.

### Error responses

| Status code               | Condition                                                                                                                                         | Response                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 400 Bad Request           | Invalid profile format or parameter, or caller-scoped repository could not be resolved                                                            | Empty body, `Chinmina-Denied` header |
| 401 Unauthorized          | Missing or invalid JWT                                                                                                                            | JSON error                           |
| 403 Forbidden             | JWT valid but claims insufficient, or GitHub rejected a caller-scoped repository                                                                  | Empty body, `Chinmina-Denied` header |
| 404 Not Found             | Profile does not exist, or is unavailable because it failed validation (for example, it names a GitHub App that is not configured or is disabled) | Empty body, `Chinmina-Denied` header |
| 500 Internal Server Error | Token vending failure, GitHub API error, or the profile names a GitHub App that could not be resolved                                             | Empty body, `Chinmina-Denied` header |

Errors raised by the endpoint carry no response body. The caller-facing reason
is returned in the `Chinmina-Denied` header, and the full cause is recorded in
the [audit log](/reference/auditing). A profile that failed validation reports
`profile unavailable: validation failed`. The server never returns client
content as part of an error message.

Two cases differ. A JWT validation failure is answered by the authentication
middleware with a JSON body and a `WWW-Authenticate` header. A request body
that cannot be parsed as credential helper input is answered with a plain text
status line and no `Chinmina-Denied` header.

[helper-protocol]: /reference/git-credentials-format
