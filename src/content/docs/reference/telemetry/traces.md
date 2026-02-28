---
title: Traces
description: Distributed trace span types, attributes, and relationships.
---

Chinmina creates distributed trace spans for HTTP requests, external API calls, and background operations. Spans capture timing information, status codes, and contextual attributes.

## HTTP server spans

HTTP server spans represent incoming requests to Chinmina endpoints.

**Span name:** Route pattern (e.g., `/token`, `/git-credentials`, `/healthcheck`, `/organization/token/{profile}`)

**Span kind:** Server

**Parent span:** Extracted from incoming request headers via W3C Trace Context propagation, if present.

**Created by:** `otelhttp.NewHandler()` wrapper around each HTTP route handler.

### Server span attributes

Attributes are added automatically by the `otelhttp` package following OpenTelemetry HTTP semantic conventions. Common attributes include:

| Attribute | Type | Description |
|-----------|------|-------------|
| `http.method` | string | HTTP method (GET, POST) |
| `http.target` | string | Request path |
| `http.scheme` | string | Protocol (http or https) |
| `http.status_code` | int | HTTP response status code |
| `http.flavor` | string | HTTP version (e.g., "1.1") |
| `http.user_agent` | string | User-Agent header value |
| `net.host.name` | string | Server hostname |
| `net.host.port` | int | Server port |

**Status:**
- `Ok` for successful requests
- `Error` for failed requests (HTTP 4xx/5xx)

### Request identity attributes

The JWT validation middleware extracts Buildkite identity fields from the authenticated token and writes them to the current span. These attributes appear on every authenticated request span.

| Attribute | Type | Description |
|-----------|------|-------------|
| `buildkite.organization_slug` | string | Buildkite organization |
| `buildkite.pipeline_slug` | string | Pipeline that initiated the request |
| `buildkite.job_id` | string | Job ID |
| `buildkite.build_number` | int | Build number |
| `buildkite.build_branch` | string | Branch being built |

### Instrumented endpoints

All authenticated endpoints create server spans:
- `POST /token`
- `POST /git-credentials`
- `GET /healthcheck`
- `POST /organization/token/{profile}`
- `POST /organization/git-credentials/{profile}`

## HTTP client spans

HTTP client spans represent outgoing requests to external APIs.

**Span name:** Varies by request (typically HTTP method and URL path)

**Span kind:** Client

**Parent span:** Server span from incoming request, or profile refresh span for background operations.

**Created by:** `otelhttp.NewTransport()` wrapper around the HTTP client transport.

### Client span attributes

Attributes are added by the `otelhttp` package. Common attributes include:

| Attribute | Type | Description |
|-----------|------|-------------|
| `http.method` | string | HTTP method (GET, POST, etc.) |
| `http.url` | string | Full request URL |
| `http.status_code` | int | HTTP response status code |
| `http.target` | string | Request path |
| `net.peer.name` | string | Target hostname |
| `net.peer.port` | int | Target port |

### Connection trace attributes

When `OBSERVE_CONNECTION_TRACE_ENABLED=true`, additional timing attributes are added to client spans:

- DNS lookup timing
- Connection establishment timing
- TLS handshake timing
- Time to first byte

These attributes are added to the parent HTTP client span rather than creating separate child spans.

### External services

Client spans are created for requests to:
- **GitHub API** (`api.github.com`): Token generation requests
- **Buildkite API** (`api.buildkite.com`): Pipeline repository lookups

## Profile refresh span

The profile refresh span represents periodic background operations that fetch and update organization profile configurations.

**Span name:** `refresh_organization_profile`

**Tracer name:** `github.com/chinmina/chinmina-bridge/internal/profile`

**Span kind:** Internal

**Parent span:** None (root span for background operation)

**Lifecycle:** Created at the start of each periodic refresh operation, ended when the operation completes.

### Profile refresh attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `profile.digest_current` | string | SHA-256 digest of previous profile configuration (hex-encoded) |
| `profile.digest_updated` | string | SHA-256 digest of new profile configuration (hex-encoded) |
| `profile.digest_changed` | bool | Whether configuration content changed |

Attributes are added during the profile update process, after the new profile is computed but before it is stored.

### Status codes

| Condition | Status Code | Status Message |
|-----------|-------------|----------------|
| Success | `Ok` | `"profile refreshed"` |
| Panic during refresh | `Error` | `"profile refresh panicked"` |
| Fetch failure | `Error` | `"profile refresh failed"` |

**Error recording:** Errors are recorded on the span via `span.RecordError()` before setting the error status.

### Child spans

Profile refresh operations create child HTTP client spans for requests to the GitHub API to fetch profile configurations.

## Cache operation span attributes

Each cache operation (get, set, invalidate) writes its result and timing directly to the active span. These attributes appear alongside the HTTP server span attributes on the parent request.

| Attribute | Type | Description |
|-----------|------|-------------|
| `cache.type` | string | Cache backend (`"memory"` or `"distributed"`) |
| `cache.{operation}.status` | string | Outcome of the operation |
| `cache.{operation}.duration` | float64 | Duration in seconds |

Where `{operation}` is one of `get`, `set`, or `invalidate`.

## Encryption operation span attributes

When cache encryption is active, encrypt and decrypt operations write timing and outcome attributes to the active span.

| Attribute | Type | Description |
|-----------|------|-------------|
| `cache.{operation}.duration` | float64 | Duration in seconds |
| `cache.{operation}.outcome` | string | `"success"` or `"error"` |

Where `{operation}` is `encrypt` or `decrypt`.

## Span relationships

### Request flow

Typical trace hierarchy for a token request:

```text
Server span: POST /token
├── Client span: GET api.buildkite.com/v2/organizations/.../pipelines/...
└── Client span: POST api.github.com/app/installations/.../access_tokens
```

### Background refresh flow

Profile refresh creates a root span with child API call spans:

```text
Internal span: refresh_organization_profile
└── Client span: GET api.github.com/...
```

## Span volume

With full tracing enabled, each token request generates:
- 1 server span (incoming request)
- 1–2 client spans (Buildkite API + GitHub API)
- Connection timing attributes on client spans (if `OBSERVE_CONNECTION_TRACE_ENABLED=true`)

Organization endpoint requests generate fewer spans (1 server + 1 client) because no Buildkite API call is needed.

Background profile refresh operations generate additional traces periodically based on the configured refresh interval.

## Configuration

For span configuration details, see:
- [Configuration reference](../configuration) for `OBSERVE_*` variables
- [Observability guide](../../guides/observability) for setup instructions
