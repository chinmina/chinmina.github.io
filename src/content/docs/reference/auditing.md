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

Related fields are grouped into nested JSON objects by concern: `request`, `pipeline`, `authorization`, and `token`. The `request` and `authorization` sections are always present. The `pipeline` and `token` sections are omitted when all their fields are empty — for example, when a request fails before JWT validation completes or before a token operation begins.

## Fields

### Identifying fields

###### `level`

Always `"audit"`.

###### `message`

Always `"audit_event"`.

### `request`

Always present.

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

### `pipeline`

Present when Buildkite identity claims are available from the JWT. Omitted when JWT validation fails before claims can be extracted.

###### `organizationSlug`

The Buildkite organization slug.

###### `pipelineSlug`

The pipeline slug.

###### `jobID`

The Buildkite job ID.

###### `buildNumber`

The build number.

###### `buildBranch`

The Git branch for the build.

### `authorization`

Always present. Contains JWT validation results.

###### `authorized`

Boolean indicating whether the request JWT was successfully authorized.

###### `subject`

The contents of the `sub` field from the JWT.

###### `issuer`

The JWT `iss` field.

###### `audience`

Array of `aud` field values from the JWT.

###### `expiry`

The JWT expiry time as an [RFC-3339][rfc-3339] date-time string.

###### `expiryRemaining`

The time the JWT will remain valid at the time of logging, in milliseconds.

### `token`

Present when a token operation occurs (profile lookup, token creation, or match evaluation). Omitted when the request fails before reaching the token stage.

###### `requestedProfile`

The profile name requested. Omitted for pipeline-based requests without a profile.

###### `requestedRepository`

The repository URL supplied by the client. Present when using `/git-credentials` endpoints.

###### `vendedRepository`

The repository URL the token was vended for. Only present on successful token issuance.

###### `repositories`

Array of repository URLs the token allows access to. Only present on successful token issuance.

###### `permissions`

Object containing GitHub token permissions assigned to the token. Only present on successful token issuance.

###### `expiry`

The GitHub token expiry time as an [RFC-3339][rfc-3339] date-time string. Only present on successful token issuance.

###### `expiryRemaining`

The time the GitHub token will remain valid at the time of logging, in milliseconds. Only present on successful token issuance.

###### `matches`

Array of matched claim/value pairs on successful profile access. Each element contains `claim` and `value` fields.

###### `attemptedPatterns`

Array showing which condition failed on denied access. Each element contains `claim`, `pattern`, and `value` fields.

### `error`

Top-level field. The error produced by the request. Only present when an error occurred. This may come from internal errors or panics, as well as JWT validation and token creation components.

HTTP error responses return generic messages like "Forbidden" to avoid leaking policy details to clients. Detailed error information is only available in audit logs.

## Examples

### Pipeline-based token request

```json
{
  "level": "audit",
  "request": {
    "method": "POST",
    "path": "/git-credentials",
    "status": 200,
    "sourceIP": "1.2.3.4:34340",
    "userAgent": "curl/8.3.0"
  },
  "pipeline": {
    "organizationSlug": "example-org",
    "pipelineSlug": "example-repo",
    "jobID": "0184990a-477b-4fa8-9968-496074483cee",
    "buildNumber": 42,
    "buildBranch": "feature-branch"
  },
  "authorization": {
    "authorized": true,
    "subject": "organization:example-org:pipeline:example-repo:ref:refs/heads/feature-branch:commit:40631gitcommithash8b3:step:step-name-from-pipeline",
    "issuer": "https://agent.buildkite.com",
    "audience": ["github-app-auth:example-org"],
    "expiry": "2025-01-20T04:52:58Z",
    "expiryRemaining": 299372
  },
  "token": {
    "repositories": ["https://github.com/example-org/example-repo.git"],
    "permissions": ["contents:read"],
    "expiry": "2025-01-20T05:09:45Z",
    "expiryRemaining": 1306372
  },
  "type": "audit",
  "time": "2025-01-20T04:47:00Z",
  "message": "audit_event"
}
```

### Successful organization profile access

```json
{
  "level": "audit",
  "request": {
    "method": "POST",
    "path": "/organization/token/release-publisher",
    "status": 200,
    "sourceIP": "1.2.3.4:34340",
    "userAgent": "curl/8.3.0"
  },
  "pipeline": {
    "organizationSlug": "example-org",
    "pipelineSlug": "silk-release",
    "jobID": "0184990a-477b-4fa8-9968-496074483cee",
    "buildNumber": 7,
    "buildBranch": "main"
  },
  "authorization": {
    "authorized": true,
    "subject": "organization:example-org:pipeline:silk-release:ref:refs/heads/main:commit:abc123:step:publish",
    "issuer": "https://agent.buildkite.com",
    "audience": ["github-app-auth:example-org"]
  },
  "token": {
    "requestedProfile": "release-publisher",
    "matches": [
      { "claim": "pipeline_slug", "value": "silk-release" },
      { "claim": "build_branch", "value": "main" }
    ],
    "repositories": ["https://github.com/example-org/release-tools.git"],
    "permissions": ["contents:write", "packages:write"],
    "expiry": "2025-01-20T05:09:45Z",
    "expiryRemaining": 1306372
  },
  "type": "audit",
  "time": "2025-01-20T04:47:00Z",
  "message": "audit_event"
}
```

### Denied profile access (match failed)

```json
{
  "level": "audit",
  "request": {
    "method": "POST",
    "path": "/organization/token/release-publisher",
    "status": 403,
    "sourceIP": "1.2.3.4:34340",
    "userAgent": "curl/8.3.0"
  },
  "pipeline": {
    "organizationSlug": "example-org",
    "pipelineSlug": "silk-staging",
    "jobID": "0184990a-477b-4fa8-9968-496074483cee",
    "buildNumber": 15,
    "buildBranch": "main"
  },
  "authorization": {
    "authorized": true,
    "subject": "organization:example-org:pipeline:silk-staging:ref:refs/heads/main:commit:abc123:step:publish",
    "issuer": "https://agent.buildkite.com",
    "audience": ["github-app-auth:example-org"]
  },
  "token": {
    "requestedProfile": "release-publisher",
    "attemptedPatterns": [
      {
        "claim": "pipeline_slug",
        "pattern": ".*-release",
        "value": "silk-staging"
      }
    ]
  },
  "error": "profile match conditions not met",
  "type": "audit",
  "time": "2025-01-20T04:47:00Z",
  "message": "audit_event"
}
```

[rfc-3339]: https://pkg.go.dev/time#RFC3339
