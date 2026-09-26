---
title: GET /healthcheck
description: Health check endpoint for monitoring Chinmina Bridge service availability.
---

The `GET /healthcheck` endpoint reports whether Chinmina Bridge is accepting HTTP requests.
It supports container probes, load balancer health checks, and monitoring systems.

The endpoint does not check GitHub API, Buildkite API, or AWS KMS connectivity.
A successful response does not guarantee that token requests will succeed.

## Request format

The endpoint requires no authentication and takes no parameters.
When [`SERVER_BASE_PATH`](/reference/configuration#server_base_path) is set, the endpoint is served under that prefix.
For example, `/api` places the endpoint at `/api/healthcheck`.

```http
GET /healthcheck HTTP/1.1
Host: localhost:8080
```

## Response format

The endpoint returns `200 OK` with `Content-Type: text/plain` and the body `OK`.

```http
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 2

OK
```

## Startup and shutdown

When [`GITHUB_ORG_PROFILE`](/reference/configuration#github_org_profile) is set, the listener remains closed until the first profile generation loads.
Health checks receive a connection failure during this period.
A failed refresh after startup retains the last loaded generation and does not change the health response.

During shutdown, the listener closes and stops accepting new connections.
The endpoint has no startup or shutdown `503` response.

Container probe configuration is covered in the [deployment example](/guides/deployment-example#health-checks).
