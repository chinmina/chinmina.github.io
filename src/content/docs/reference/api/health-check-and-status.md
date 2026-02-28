---
title: GET /healthcheck
description: Health check endpoint for monitoring Chinmina Bridge service availability.
---

The `GET /healthcheck` endpoint provides a simple mechanism to verify that the Chinmina Bridge service is running and accepting HTTP requests.

For documentation of token-issuing endpoints, see [POST /token](./post-token), [POST /git-credentials](./git-credentials), and [Profile-Scoped Endpoints](./profile-scoped-endpoints).

## Purpose

This endpoint is designed for use with Kubernetes liveness probes, load balancer health checks, and monitoring systems. It provides a lightweight, unauthenticated health check that validates only HTTP server functionality, not external dependencies.

:::note

The health check does not validate the state of GitHub API, Buildkite API, or AWS KMS connectivity. Use the token-issuing endpoints if you need to verify full system health.

:::

## Request format

This endpoint is not authenticated and takes no parameters.

## Response format

The endpoint returns an HTTP status code with no response body:

| Status Code           | Meaning                                                  |
| --------------------- | -------------------------------------------------------- |
| `200 OK`              | Service is running and accepting requests                |
| `503 Service Unavailable` | Service is not ready (typically during startup/shutdown) |

### Example request

```bash
curl http://localhost:8080/healthcheck
```

## Error responses

This endpoint does not return JSON error responses. HTTP status codes are the sole indicator of health.
