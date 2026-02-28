---
title: Metrics
description: OpenTelemetry metrics, types, units, and attributes.
---

Chinmina collects metrics for HTTP request handling, cache operations, encryption, and token vendor behavior. Metrics use dimensional attributes for filtering and aggregation.

## HTTP server metrics

Every route is wrapped with [`otelhttp.NewHandler()`][otelhttp], which produces [HTTP semantic convention][semconv-http] metrics automatically.

### http.server.request.duration

**Type:** Float64Histogram

**Unit:** `s` (seconds)

Server request duration. Attributes include `http.request.method`, `http.response.status_code`, `http.route`, and `url.scheme`.

### http.server.request.body.size

**Type:** Float64Histogram

**Unit:** `By` (bytes)

Size of the request body.

### http.server.response.body.size

**Type:** Float64Histogram

**Unit:** `By` (bytes)

Size of the response body.

### Example queries

Calculate p99 request latency:

```text
histogram_quantile(0.99,
  sum(rate(http_server_request_duration_bucket)) by (le)
)
```

Track 5xx error rate by route:

```text
sum(rate(http_server_request_duration_count{http_response_status_code=~"5.."})) by (http_route) /
sum(rate(http_server_request_duration_count)) by (http_route)
```

## HTTP client metrics

When `OBSERVE_HTTP_TRANSPORT_ENABLED=true`, outgoing requests to Buildkite and GitHub APIs are wrapped with `otelhttp.NewTransport()`, producing client-side HTTP semantic convention metrics. These mirror the server metrics above with a `http.client.*` prefix.

Connection-level trace attributes (DNS, TLS handshake timing) are added when `OBSERVE_CONNECTION_TRACE_ENABLED=true`. See [traces](./traces#connection-trace-attributes) for details.

## cache.operations

Counts cache operations performed.

**Type:** Int64Counter

**Unit:** None (dimensionless count)

**Meter:** `github.com/chinmina/chinmina-bridge/internal/cache`

### Attributes

| Attribute | Type | Values |
|-----------|------|--------|
| `cache.type` | string | Cache implementation type (e.g., `"token"`) |
| `cache.operation` | string | `"get"`, `"set"`, `"invalidate"` |
| `cache.status` | string | `"hit"`, `"miss"`, `"error"`, `"success"` |

### Status semantics

| Operation | Success Status | Failure Status |
|-----------|----------------|----------------|
| `get` | `"hit"` or `"miss"` | `"error"` |
| `set` | `"success"` | `"error"` |
| `invalidate` | `"success"` | `"error"` |

**Note:** For `get` operations, `"hit"` indicates a cached value was found, `"miss"` indicates no cached value exists, and `"error"` indicates the cache operation failed.

### Example queries

Calculate cache hit rate:

```text
sum(rate(cache_operations{cache_operation="get",cache_status="hit"})) /
sum(rate(cache_operations{cache_operation="get"}))
```

Count failed cache operations:

```text
sum(rate(cache_operations{cache_status="error"}))
```

## cache.operation.duration

Measures duration of cache operations.

**Type:** Float64Histogram

**Unit:** `s` (seconds)

**Meter:** `github.com/chinmina/chinmina-bridge/internal/cache`

### Attributes

| Attribute | Type | Values |
|-----------|------|--------|
| `cache.type` | string | Cache implementation type (e.g., `"token"`) |
| `cache.operation` | string | `"get"`, `"set"`, `"invalidate"` |

Duration is measured from operation start to completion. The metric is recorded before the operation status is determined, so duration histograms include both successful and failed operations.

Expected values for the in-memory token cache: `get` operations typically complete in under 10ms, `set` operations in under 20ms. Sustained values above these thresholds may indicate memory pressure or garbage collection pauses.

### Example queries

Calculate p95 cache operation latency:

```text
histogram_quantile(0.95,
  sum(rate(cache_operation_duration_bucket{cache_operation="get"})) by (le)
)
```

Compare average operation durations by type:

```text
sum(rate(cache_operation_duration_sum)) by (cache_operation) /
sum(rate(cache_operation_duration_count)) by (cache_operation)
```

## cache.encryption.duration

Measures duration of encrypt and decrypt operations on cached values.

**Type:** Float64Histogram

**Unit:** `s` (seconds)

**Meter:** `github.com/chinmina/chinmina-bridge/internal/cache`

These metrics are only produced when the distributed cache is configured with encryption (via Tink AEAD with AWS KMS).

### Attributes

| Attribute | Type | Values |
|-----------|------|--------|
| `encryption.operation` | string | `"encrypt"`, `"decrypt"` |

### Example queries

Calculate p95 encryption latency:

```text
histogram_quantile(0.95,
  sum(rate(cache_encryption_duration_bucket)) by (le, encryption_operation)
)
```

## cache.encryption.total

Counts encrypt and decrypt operations.

**Type:** Int64Counter

**Unit:** None (dimensionless count)

**Meter:** `github.com/chinmina/chinmina-bridge/internal/cache`

### Attributes

| Attribute | Type | Values |
|-----------|------|--------|
| `encryption.operation` | string | `"encrypt"`, `"decrypt"` |
| `encryption.outcome` | string | `"success"`, `"error"` |

### Example queries

Track encryption error rate:

```text
sum(rate(cache_encryption_total{encryption_outcome="error"})) /
sum(rate(cache_encryption_total))
```

## token.cache.outcome

Counts token cache lookup outcomes in the vendor layer.

**Type:** Int64Counter

**Unit:** None (dimensionless count)

**Meter:** `github.com/chinmina/chinmina-bridge/internal/vendor`

### Attributes

| Attribute | Type | Values | Description |
|-----------|------|--------|-------------|
| `token.cache.result` | string | `"hit"`, `"miss"`, `"mismatch"` | Lookup outcome |

### Result semantics

| Result | Meaning |
|--------|---------|
| `"hit"` | Cached token found and repository matches request |
| `"miss"` | No cached token found or cache error occurred |
| `"mismatch"` | Cached token found but repository does not match request (cache invalidated) |

A `"mismatch"` result occurs when a cached token exists but was vended for a different repository than the current request. In this case, the cache is invalidated and a new token is generated.

High mismatch rates indicate pipelines that frequently switch between repositories — for example, sequential pipeline steps accessing different repos, or pipelines using multiple organization profiles. A sustained mismatch rate above the miss rate may point to profile configuration issues worth investigating.

The overall cache hit rate is:

```text
hit_rate = hits / (hits + misses + mismatches)
```

### Example queries

Calculate token cache hit rate:

```text
sum(rate(token_cache_outcome{token_cache_result="hit"})) /
sum(rate(token_cache_outcome))
```

Track mismatch frequency:

```text
sum(rate(token_cache_outcome{token_cache_result="mismatch"}))
```

## Cache type identifiers

The `cache.type` attribute distinguishes between different cache instances. Current values:

| Cache Type | Value |
|------------|-------|
| Token vendor cache | `"token"` |

## Configuration

For metric configuration details, see:
- [Configuration reference](../configuration) for `OBSERVE_METRICS_*` variables
- [Observability guide](../../guides/observability) for setup instructions

[otelhttp]: https://pkg.go.dev/go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp
[semconv-http]: https://opentelemetry.io/docs/specs/semconv/http/http-metrics/
