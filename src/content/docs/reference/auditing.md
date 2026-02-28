---
title: Auditing
description: Audit log format, fields, and examples.
---

Audit logs provide a level of non-repudiation for the system. These logs are written to the container's stdout, and cannot be disabled.

Each authenticated endpoint (both `/token` and `/git-credentials`) records details about the request, the authorization process, and the GitHub token created. Errors are also recorded.

## Characteristics

Requests to non-existent routes are not logged. Access logs or firewall logs are better sources for this traffic.

A panic in the request chain still results in the audit log being written. Panic details appear in the `error` field, and the panic propagates after the log is written.

HTTP error responses return generic messages like "Forbidden" to avoid leaking policy details to clients. Detailed error information is only available in audit logs. This prevents unauthorized users from learning about profile configurations or match conditions.

## Log format

Logs are written to stdout using zerolog at the "audit" log level. All audit logs are in single-line JSON format.

## Fields

### Identifying fields

###### `level`

Always `"audit"`.

###### `message`

Always `"audit_event"`.

### Request fields

###### `method`

The HTTP request method. Currently always `POST` for authenticated endpoints.

###### `path`

The requested path (e.g., `/token`, `/git-credentials`, `/organization/token/profile-name`).

###### `status`

The HTTP response status code.

###### `sourceIP`

The client IP address and port.

###### `userAgent`

The user agent reported by the client.

###### `error`

The error produced by the request. This may come from internal errors or panics, as well as JWT validation and token creation components. Empty string when no error occurred.

HTTP error responses return generic messages like "Forbidden" to avoid leaking policy details to clients. Detailed error information is only available in audit logs.

### Authorization fields

###### `authorized`

Boolean indicating whether the request JWT was successfully authorized.

###### `authSubject`

The contents of the `sub` field from the JWT.

###### `authIssuer`

The JWT `iss` field.

###### `authAudience`

Array of `aud` field values from the JWT.

###### `authExpiry`

The JWT expiry time as an [RFC-3339][rfc-3339] date-time string.

###### `authExpiryRemaining`

The number of seconds the JWT will remain valid at the time of logging.

### Token fields

###### `repositories`

Array of repository URLs the token allows access to. Only present on successful token issuance.

###### `permissions`

Object containing GitHub token permissions assigned to the token. Only present on successful token issuance.

###### `expiry`

The GitHub token expiry time as an [RFC-3339][rfc-3339] date-time string. Only present on successful token issuance.

###### `expiryRemaining`

The number of seconds the GitHub token will remain valid at the time of logging. Only present on successful token issuance.

### Profile fields

###### `requestedProfile`

The profile name requested. Empty for pipeline-based requests.

###### `matches`

Array of matched claim/value pairs on successful profile access. Each element contains `claim` and `value` fields.

###### `attemptedPatterns`

Array showing which condition failed on denied access. Each element contains `claim`, `pattern`, and `value` fields.

### Repository fields

###### `requestedRepository`

The repository URL supplied by the client. Present when using `/git-credentials` endpoints.

###### `vendedRepository`

The repository URL the token was vended for. Only present on successful token issuance.

## Examples

### Pipeline-based token request

```json
{
  "level": "audit",
  "method": "POST",
  "path": "/git-credentials",
  "status": 200,
  "sourceIP": "1.2.3.4:34340",
  "userAgent": "curl/8.3.0",
  "requestedProfile": "",
  "authorized": true,
  "authSubject": "organization:example-org:pipeline:example-repo:ref:refs/heads/feature-branch:commit:40631gitcommithash8b3:step:step-name-from-pipeline",
  "authIssuer": "https://agent.buildkite.com",
  "error": "",
  "authExpiry": "2025-01-20T04:52:58Z",
  "authExpiryRemaining": 299372,
  "expiry": "2025-01-20T05:09:45Z",
  "expiryRemaining": 1306372,
  "authAudience": ["github-app-auth:example-org"],
  "repositories": ["https://github.com/example-org/example-repo.git"],
  "permissions": ["contents:read"],
  "type": "audit",
  "time": "2025-01-20T04:47:00Z",
  "message": "audit_event"
}
```

### Successful organization profile access

```json
{
  "level": "audit",
  "method": "POST",
  "path": "/organization/token/release-publisher",
  "status": 200,
  "sourceIP": "1.2.3.4:34340",
  "userAgent": "curl/8.3.0",
  "requestedProfile": "release-publisher",
  "authorized": true,
  "matches": [
    { "claim": "pipeline_slug", "value": "silk-release" },
    { "claim": "build_branch", "value": "main" }
  ],
  "repositories": ["https://github.com/example-org/release-tools.git"],
  "permissions": ["contents:write", "packages:write"],
  "type": "audit",
  "time": "2025-01-20T04:47:00Z",
  "message": "audit_event"
}
```

### Denied profile access (match failed)

```json
{
  "level": "audit",
  "method": "POST",
  "path": "/organization/token/release-publisher",
  "status": 403,
  "sourceIP": "1.2.3.4:34340",
  "userAgent": "curl/8.3.0",
  "requestedProfile": "release-publisher",
  "authorized": true,
  "attemptedPatterns": [
    {
      "claim": "pipeline_slug",
      "pattern": ".*-release",
      "value": "silk-staging"
    }
  ],
  "error": "profile match conditions not met",
  "type": "audit",
  "time": "2025-01-20T04:47:00Z",
  "message": "audit_event"
}
```

[rfc-3339]: https://pkg.go.dev/time#RFC3339
