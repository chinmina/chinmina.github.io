---
title: Observability
description: Using OpenTelemetry and logging to understand and diagnose Chinmina.
---

Chinmina produces traces and metrics via OpenTelemetry, and logs to stdout via [zerolog][zerolog].

For audit log details, see the [auditing reference](../reference/auditing). For complete telemetry technical details, see the [telemetry reference](../reference/telemetry).

## Enabling OpenTelemetry

Set `OBSERVE_ENABLED=true` to enable telemetry collection.

Choose an exporter type with `OBSERVE_TYPE`:
- `"grpc"` (default): Send to an OpenTelemetry collector via gRPC
- `"stdout"`: Write to standard output (development only)

### Minimal configuration

For gRPC export to a collector:

```bash
OBSERVE_ENABLED=true
OBSERVE_TYPE=grpc
OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4317
```

For stdout export during development:

```bash
OBSERVE_ENABLED=true
OBSERVE_TYPE=stdout
```

See the [configuration reference](../reference/configuration) for all `OBSERVE_*` variables, including collector settings, batch timeouts, and metric read intervals.

## Critical user journeys

Critical user journeys (CUJs) define the key operations that affect users of the system. Each CUJ maps to a trace structure and a set of service level indicators (SLIs) to monitor.

### Token generation

Generates a GitHub token for the pipeline's repository. This is the primary operation and the critical path for pipeline execution.

**Endpoint:** `POST /token`

**Trace structure:**
```
Server span: POST /token
├── Client span: GET api.buildkite.com/v2/.../pipelines/...
└── Client span: POST api.github.com/app/installations/.../access_tokens
```

The server span captures total request duration and HTTP status. The Buildkite API span shows pipeline lookup performance, and the GitHub API span shows token creation performance.

**SLIs to monitor:**
- p95/p99 server span duration
- HTTP 5xx error rate
- Cache hit rate (cached requests skip both API calls)

**Suggested SLO targets:**

| Metric | Objective | Rationale |
|--------|-----------|-----------|
| Success rate | 99.9% | Critical path for pipeline execution |
| p99 latency | < 2s | Minimize delay in clone operations |
| p95 latency | < 1s | Typical case performance |
| Cache hit rate | > 70% | Reduce API load and latency |
| GitHub API p95 latency | < 500ms | Monitor external dependency health |
| Buildkite API p95 latency | < 300ms | Monitor external dependency health |

### Git credentials

**Endpoint:** `POST /git-credentials`

Identical trace structure to token generation (same underlying implementation). Git retries failed requests automatically, so slow responses directly delay clone operations. Monitor the same SLIs and SLO targets as token generation.

### Organization endpoints

**Endpoints:** `POST /organization/token/{profile}`, `POST /organization/git-credentials/{profile}`

Generates tokens scoped to repositories defined in an organization profile rather than the pipeline's own repository.

**Trace structure:**
```
Server span: POST /organization/token/{profile}
└── Client span: POST api.github.com/app/installations/.../access_tokens
```

No Buildkite API call occurs because the repository is determined by the profile configuration. Monitor the same SLIs as token generation, but expect lower latency on uncached requests due to the single API call.

**Suggested SLO targets:** Same as token endpoints. External API targets differ — only GitHub API applies:

| Metric | Objective | Rationale |
|--------|-----------|-----------|
| GitHub API p95 latency | < 500ms | Monitor external dependency health |

### Background profile refresh

Periodically fetches organization profile configurations from the configuration source.

**Trace structure:**
```
Internal span: refresh_organization_profile
└── Client span: GET api.github.com/...
```

**Attributes:**
- `profile.digest_current`: Previous configuration hash
- `profile.digest_updated`: New configuration hash
- `profile.digest_changed`: Whether content changed

**SLIs to monitor:**
- Span error rate (fetch failures affect profile availability)
- `profile.digest_changed` frequency (unexpected changes may indicate configuration issues)

## Diagnostics

### High latency

**Symptoms:** p95/p99 latency exceeds objectives

**Investigation:**
1. Check external API span durations
2. Verify cache hit rate meets objectives
3. Review connection timing attributes
4. Check for network issues between service and APIs

**Remediation:**
- Increase token TTL to improve cache hit rate
- Review network path to external APIs
- Consider connection pooling configuration

### High error rate

**Symptoms:** HTTP 5xx error rate above threshold

**Investigation:**
1. Filter traces by error status
2. Examine error messages in span events
3. Check audit logs for detailed error information
4. Verify external API availability

**Remediation:**
- Review GitHub App permissions
- Verify Buildkite API token scopes
- Check profile match conditions
- Investigate panic recovery patterns

### Cache inefficiency

**Symptoms:** Cache hit rate below 70%

**Investigation:**
1. Calculate hit/miss/mismatch ratio using `token.cache.outcome`
2. Check token expiry times in audit logs
3. Review repository access patterns
4. Examine profile configurations

**Remediation:**
- Increase token expiry duration (if GitHub App allows)
- Consolidate repository access patterns
- Review profile match conditions
- Consider organizational endpoint usage
- Enable the [distributed cache](./distributed-cache) to share tokens across replicas

[zerolog]: https://github.com/rs/zerolog/
