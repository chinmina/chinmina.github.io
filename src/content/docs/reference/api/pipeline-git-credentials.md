---
title: POST /git-credentials/{profile}
description: Git credential helper endpoint that returns GitHub tokens in Git credential format.
---

The `POST /git-credentials/{profile}` (and legacy `POST /git-credentials`)
endpoints vend short-lived GitHub installation tokens validated against
Buildkite OIDC tokens.

The profile parameter selects the pipeline profile that will be used when
creating the token using permissions defined by the specified [pipeline
profile](/reference/profiles/pipeline).

The reserved profile name `default` is always available. The default profile can
be requested via `POST /git-credentials/default` or `POST /git-credentials`.
Permissions for the `default` profile [can be
changed](/reference/profiles/pipeline#defaults) but `match` rules cannot be added.

## Purpose

This endpoint serves the same underlying function as `/token` (vending GitHub
installation tokens), however its request and response format follows Git's
[credential helper protocol][helper-protocol]. This allows Chinmina Bridge to
act as a Git credential helper, enabling transparent authentication for Git
operations without requiring separate credential extraction and configuration
steps.

See the [Buildkite integration guide](/guides/buildkite-integration) for
details on how this endpoint is used in practice.

:::note

The `/token` endpoint returns the same data in a generic JSON format. Use
`/git-credentials` when integrating directly with Git's credential helper
system. Use `/token` when you need token metadata, are making direct API calls,
or want more flexible response handling.

:::

## Request format

### Headers

| Header          | Required    | Description                                |
| --------------- | ----------- | ------------------------------------------ |
| `Authorization` | Yes         | Bearer token containing Buildkite OIDC JWT |
| `Content-Type`  | Recommended | Should be `text/plain`                     |

### Profile parameter

The optional `{profile}` path parameter specifies which pipeline profile to use:

- `/git-credentials` (no parameter): Uses pipeline default permissions
- `/git-credentials/default`: Same as `/git-credentials` (explicitly requests default permissions)
- `/git-credentials/{profile-name}`: Uses the named pipeline profile

Profile names are used directly in the path. The API does not use prefixes
(prefixes like `pipeline:` are part of the plugin interface only).

Examples:

- `POST /git-credentials` → default pipeline permissions
- `POST /git-credentials/pr-commenter` → "pr-commenter" pipeline profile
- `POST /git-credentials/release` → "release" pipeline profile

If the profile does not exist or the pipeline doesn't match the profile's access
rules, the request returns an error.

### Request body

The request body follows Git's credential helper input format:

```text
protocol=https
host=github.com
path=owner/repository
```

## Response format

### Success response (200 OK)

When a token is successfully vended, the response contains Git credential helper output:

```text
protocol=https
host=github.com
path=owner/repository
username=x-access-token
password=ghs_...
password_expiry_utc=1705320600
```

The response body is plain text with newline-separated key-value pairs. Git
parses this and uses the credentials for the requested operation. The
`protocol`, `host` and `path` lines echo the request.

With [`DEV_DISCLOSE_APP_IDENTIFIERS`](/reference/configuration#dev_disclose_app_identifiers)
set, the response also carries `chinmina_app_name`, `chinmina_app_id` and
`chinmina_installation_id`. See [development
properties](/reference/git-credentials-format#development-properties). This
setting is for development only.

### Empty response (200 OK)

When the requested repository does not match the pipeline's repository, the
endpoint returns a successful but empty response. See [Git credentials
format](/reference/git-credentials-format#empty-response) for details on
empty response behavior.

### Error responses

| Status code               | Condition                                                                                                                                         | Response                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 401 Unauthorized          | Missing or invalid JWT                                                                                                                            | JSON error                           |
| 403 Forbidden             | Pipeline doesn't match profile's access rules                                                                                                     | Empty body, `Chinmina-Denied` header |
| 404 Not Found             | Profile does not exist, or is unavailable because it failed validation (for example, it names a GitHub App that is not configured or is disabled) | Empty body, `Chinmina-Denied` header |
| 500 Internal Server Error | Token vending failure, Buildkite or GitHub API error, or the profile names a GitHub App that could not be resolved                                | Empty body, `Chinmina-Denied` header |

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
