---
title: Observability
description: Using Open Telemetry and logging to understand and diagnose Chinmina
---

The system produces traces and metrics via Open Telemetry, and logs to stdout
via [zerolog](https://github.com/rs/zerolog/). There are minimal informational
logs, as well as per-request audit logs that are written to the process's
`stdout`.

## Audit logs

Audit logs provide a level of non-repudiation for the system. These logs are
written to the container's stdout, and cannot be disabled.

:::tip

Requests to non-existent routes do not form part of the audit log. Access logs
or firewall logs are better sources for this information.

:::

Each authenticated endpoint (both `/token` and `/git-credentials`) will record
details about the request, the authorization process, and the GitHub token
created. If an error occurs, this is also written out.

At a technical level, logs are written to stdout using zerolog at the "audit"
log level. Initial data is collected by request middleware and the partial entry
is then accessible via the context. The context entry is further enriched with
details by other components, including both the JWT middleware and the vendor.
such that the log is fully completed by the end of the request.

:::note[Important]

A panic in the request chain will still result in the audit log being written,
and the panic details will also be included.

:::

### Audit log fields

All audit logs are in single-line JSON format, using the `level` of `audit`.

1. Identifying data
   - `level`: this is always `audit`
   - `message`: this is always `audit_event`
2. Request data
   - `method`: the request method. This will currently be `GET` for all standard requests.
   - `path`: the requested path.
   - `status` is the HTTP response status of the request
   - `sourceIP` is the client IP of the requestor
   - `userAgent` is the user agent reported by the client
   - `error` is the error produced by the request. This may come from internal
     errors or panics, as well as the JWT validation and token creation
     components.
3. Authorization data
   - `authorized` is a boolean that is `true` when the request JWT is
     successfully authorized by the service.
   - `authSubject` is the contents of the `sub` field from the JWT
   - `authIssuer` is the JWT `iss` field
   - `authAudience` is the (possibly multiple) reported `aud` field values from
     the JWT
   - `authExpiry` is the JWT expiry time represented as an
     [RFC-3339](https://pkg.go.dev/time#RFC3339) date time string.
   - `authExpiryRemaining` is the number of seconds that the JWT will be valid
     for at the time of logging.
4. Token data
   - `repositories` is the set of repositories that the token allows access to
   - `permissions` is the set of GitHub token permissions assigned to the token
   - `expiry` is the GitHub token expiry time represented as an
     [RFC-3339](https://pkg.go.dev/time#RFC3339) date time string
   - `expiryRemaining` is the number of seconds that the created GitHub token
     will be valid for at the time of logging.
5. Profile data
   - `requestedProfile` is the profile name requested (empty for pipeline-based requests)
   - `matches` is an array of matched claim/value pairs on successful profile access
   - `attemptedPatterns` is an array showing which condition failed on denied access
6. Repository data
   - `requestedRepository` contains the repository URL supplied by the client (present when using `/git-credentials` endpoints)
   - `vendedRepository` contains the repository URL the token was vended for (only present on successful token issuance)

:::note[Error message security]

HTTP error responses return generic messages like "Forbidden" to avoid leaking policy details to clients. Detailed error information is only available in audit logs. This prevents unauthorized users from learning about profile configurations or match conditions.

:::

```json title="JSON audit log example: pipeline-based token request"
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

```json title="JSON audit log example: successful organization profile access"
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
    {"claim": "pipeline_slug", "value": "silk-release"},
    {"claim": "build_branch", "value": "main"}
  ],
  "repositories": ["https://github.com/example-org/release-tools.git"],
  "permissions": ["contents:write", "packages:write"],
  "type": "audit",
  "time": "2025-01-20T04:47:00Z",
  "message": "audit_event"
}
```

```json title="JSON audit log example: denied profile access (match failed)"
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
    {"claim": "pipeline_slug", "pattern": ".*-release", "value": "silk-staging"}
  ],
  "error": "profile match conditions not met",
  "type": "audit",
  "time": "2025-01-20T04:47:00Z",
  "message": "audit_event"
}
```

## Open Telemetry

This section is a stub. For now, refer to the
[`.envrc`](https://github.com/chinmina/chinmina-bridge/blob/main/.envrc) file
for details of all Open Telemetry related configuration that's currently
possible.
