---
title: Metrics and traces
description: All Open Telemetry metrics and trace attributes produced by Chinmina.
---

Chinmina publishes metrics and enriches traces via [Open Telemetry][otel]. All
metrics and span attributes described here are emitted when observability is
[enabled](configuration#open-telemetry).

HTTP server metrics are produced automatically for every route. Custom metrics
cover caching, encryption, and token vending. Trace spans are enriched with
attributes that tie cache operations and request identity back to the
originating Buildkite job.

## HTTP server metrics

Every route is wrapped with the standard [`otelhttp`][otelhttp] handler, which
produces the following [HTTP semantic convention][semconv-http] metrics
automatically.

###### `http.server.request.duration`

_type: histogram, unit: `s`_

Server request duration. Attributes include `http.request.method`,
`http.response.status_code`, `http.route`, and `url.scheme`.

###### `http.server.request.body.size`

_type: histogram, unit: `By`_

Size of the request body in bytes.

###### `http.server.response.body.size`

_type: histogram, unit: `By`_

Size of the response body in bytes.

### Outgoing HTTP client metrics

When `OBSERVE_HTTP_TRANSPORT_ENABLED` is `true`, outgoing requests to Buildkite
and GitHub APIs are wrapped with `otelhttp.NewTransport`, producing client-side
span and metric data.

Connection-level trace attributes (DNS, TLS handshake, etc.) are added when
`OBSERVE_CONNECTION_TRACE_ENABLED` is also `true`.

## Cache metrics

Cache metrics are registered on the
`github.com/chinmina/chinmina-bridge/internal/cache` meter. They cover both
the in-memory and distributed (Valkey) cache backends.

###### `cache.operations`

_type: counter_

Total cache operations. Each get, set, or invalidation increments this counter
exactly once.

| Attribute | Values | Description |
|---|---|---|
| `cache.type` | `memory`, `distributed` | The cache backend |
| `cache.operation` | `get`, `set`, `invalidate` | The operation performed |
| `cache.status` | `hit`, `miss`, `error`, `success` | Outcome of the operation. `get` uses `hit`/`miss`/`error`; `set` and `invalidate` use `success`/`error`. |

###### `cache.operation.duration`

_type: histogram, unit: `s`_

Latency of cache operations in seconds. This measures the round-trip time to
the cache backend.

| Attribute | Values | Description |
|---|---|---|
| `cache.type` | `memory`, `distributed` | The cache backend |
| `cache.operation` | `get`, `set`, `invalidate` | The operation performed |

## Cache encryption metrics

Encryption metrics are registered on the same meter as cache metrics. They
measure the overhead of encrypting and decrypting cached values, separate from
the cache round-trip itself.

These metrics are only produced when the distributed cache is configured with
encryption (via Tink AEAD with AWS KMS).

###### `cache.encryption.duration`

_type: histogram, unit: `s`_

Duration of encrypt or decrypt operations in seconds.

| Attribute | Values | Description |
|---|---|---|
| `encryption.operation` | `encrypt`, `decrypt` | The cryptographic operation |

###### `cache.encryption.total`

_type: counter_

Total encrypt and decrypt operations.

| Attribute | Values | Description |
|---|---|---|
| `encryption.operation` | `encrypt`, `decrypt` | The cryptographic operation |
| `encryption.outcome` | `success`, `error` | Whether the operation succeeded |

## Token cache outcome metrics

Token cache outcome metrics are registered on the
`github.com/chinmina/chinmina-bridge/internal/vendor` meter. They track the
high-level result of looking up a token in the cache, including detection of
repository mismatches.

###### `token.cache.outcome`

_type: counter_

Outcome of each token cache lookup. Exactly one outcome is recorded per lookup.

| Attribute | Values | Description |
|---|---|---|
| `token.cache.result` | `hit`, `miss`, `error`, `mismatch` | `hit`: cached token returned. `miss`: key not in cache. `error`: cache infrastructure failure (treated as a miss). `mismatch`: cached token's repository does not match the request; entry is invalidated. |

## Trace span attributes

In addition to metrics, Chinmina enriches Open Telemetry spans with attributes
that make distributed traces more useful for debugging.

### Request identity

The JWT validation middleware extracts Buildkite identity fields from the
authenticated token and writes them to the current span. These attributes appear
on every authenticated request span.

| Attribute | Type | Description |
|---|---|---|
| `buildkite.organization_slug` | string | The Buildkite organization |
| `buildkite.pipeline_slug` | string | The pipeline that initiated the request |
| `buildkite.job_id` | string | The specific job ID |
| `buildkite.build_number` | int | The build number |
| `buildkite.build_branch` | string | The branch being built |

### Cache operation spans

Each cache operation (get, set, invalidate) writes its result and timing
directly to the active span. This allows end-to-end request tracing without
requiring a separate metrics dashboard.

| Attribute | Type | Description |
|---|---|---|
| `cache.type` | string | The cache backend (`memory` or `distributed`) |
| `cache.{operation}.status` | string | Outcome of the specific operation |
| `cache.{operation}.duration` | float64 | Duration of the operation in seconds |

Where `{operation}` is one of `get`, `set`, or `invalidate`.

### Encryption operation spans

When cache encryption is active, encrypt and decrypt operations also write to
the span.

| Attribute | Type | Description |
|---|---|---|
| `cache.{operation}.duration` | float64 | Duration in seconds |
| `cache.{operation}.outcome` | string | `success` or `error` |

Where `{operation}` is `encrypt` or `decrypt`.

### Profile refresh spans

The profile configuration refresh cycle writes digest information to its span,
which is useful for confirming that configuration changes have been picked up.

| Attribute | Type | Description |
|---|---|---|
| `profile.digest_current` | string | Digest of the currently loaded profiles |
| `profile.digest_updated` | string | Digest of the newly fetched profiles |
| `profile.digest_changed` | bool | Whether the profile content changed |

[otel]: https://opentelemetry.io/
[otelhttp]: https://pkg.go.dev/go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp
[semconv-http]: https://opentelemetry.io/docs/specs/semconv/http/http-metrics/
