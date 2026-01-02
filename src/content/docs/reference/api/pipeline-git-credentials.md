---
title: POST /git-credentials/{profile}
description: Git credential helper endpoint that returns GitHub tokens in Git credential format.
---

The `POST /git-credentials/{profile}` (and legacy `POST /git-credentials`)
endpoints vend short-lived GitHub installation tokens validated against
Buildkite OIDC tokens.

The profile parameter selects the pipeline profile that will be used when
creating the token using permissions defined by the specified [pipeline
profile](../profiles/pipeline).

The reserved profile name `default` is always available. The default profile can
be requested via `POST /git-credentials/default` or `POST /git-credentials`.
Permissions for the `default` profile [can be
changed](../profiles/pipeline#default) but `match` rules cannot be added.

## Purpose

This endpoint serves the same underlying function as `/token` (vending GitHub
installation tokens), however its request and response format follows Git's
[credential helper protocol][helper-protocol]. This allows Chinmina Bridge to
act as a Git credential helper, enabling transparent authentication for Git
operations without requiring separate credential extraction and configuration
steps.

See the [Buildkite integration guide](../../guides/buildkite-integration) for
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
(prefixes like `repo:` are part of the plugin interface only).

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
username=x-access-token
password=ghs_...
password_expiry_utc=1705320600
```

The response body is plain text with newline-separated key-value pairs. Git
parses this and uses the credentials for the requested operation.

### Empty response (200 OK)

When the requested repository does not match the pipeline's repository, the
endpoint returns a successful but empty response. See [Git credentials
format](../../reference/git-credentials-format#empty-response) for details on
empty response behavior.

### Error responses

| Status code               | Condition                                            | Response body |
| ------------------------- | ---------------------------------------------------- | ------------- |
| 401 Unauthorized          | Missing or invalid JWT                               | Plain text    |
| 403 Forbidden             | Pipeline doesn't match profile's access rules        | Plain text    |
| 404 Not Found             | Profile does not exist or failed validation          | Plain text    |
| 500 Internal Server Error | Token vending failure, Buildkite or GitHub API error | Plain text    |

Error responses are returned in plain text. Any response that Git does not
recognize as valid for the format is regarded as an error and discarded. Note
that the server will never return client content as part of an error message.

[helper-protocol]: ../git-credentials-format
