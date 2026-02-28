---
title: Telemetry
description: OpenTelemetry traces and metrics reference.
---

Chinmina produces distributed traces and metrics via OpenTelemetry. This telemetry provides visibility into request flows, external API calls, cache operations, and background processes.

## What OpenTelemetry provides

### Traces

Distributed traces track request execution through the system. Chinmina creates spans for:

- HTTP server requests (token and git-credentials endpoints)
- HTTP client requests (GitHub and Buildkite API calls)
- Background operations (organization profile refresh)

Traces show parent-child relationships between operations, timing information, and error details.

See [traces reference](traces) for complete span documentation.

### Metrics

Metrics provide quantitative measurements of system behavior. Chinmina collects metrics for:

- Cache operations (get, set, invalidate)
- Cache operation duration
- Token cache outcomes (hit, miss, mismatch)

Metrics include dimensional attributes for filtering and aggregation.

See [metrics reference](metrics) for complete metric documentation.

## Exporters

Two exporter types are available:

### gRPC exporter

The gRPC exporter sends telemetry to an OpenTelemetry collector via gRPC protocol. This is the default and recommended exporter for production use.

Configuration uses standard OpenTelemetry environment variables:
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_EXPORTER_OTLP_HEADERS`
- `OTEL_EXPORTER_OTLP_TIMEOUT`

### stdout exporter

The stdout exporter writes telemetry to standard output in JSON format. This exporter is intended for local development and debugging only.

## Context propagation

Chinmina propagates trace context using W3C standards:

- **W3C Trace Context**: Propagates trace ID and span ID via `traceparent` and `tracestate` headers
- **W3C Baggage**: Propagates additional metadata via `baggage` header

Context propagation enables distributed tracing across service boundaries. Incoming requests with trace context create child spans, maintaining the trace hierarchy.

## Configuration

For configuration instructions, see the [observability guide](../../guides/observability).

For complete configuration reference, see the [configuration reference](../configuration).
