---
title: Distributed caching with Valkey
description: Scale Chinmina Bridge horizontally with distributed token caching.
---

Chinmina Bridge supports distributed caching using Valkey to enable horizontal scaling across multiple instances while maintaining sub-millisecond token response times.

## Why distributed caching

When running a single instance of Chinmina Bridge, an in-memory cache stores generated tokens. Each cache miss requires a GitHub API call to generate a new token.

In a horizontally scaled deployment with multiple instances, each instance maintains its own isolated cache. When different instances receive requests for the same organization or pipeline, they each generate separate tokens, creating redundant GitHub API calls and increased latency.

Valkey provides server-assisted client-side caching. Tokens are stored in a shared Valkey server while each instance maintains a local cache of recently accessed keys. All instances share the same cached tokens, eliminating redundant API calls.

## Configuration

Distributed caching is disabled by default. Existing deployments continue using in-memory caching unless explicitly configured otherwise.

Set the cache type to Valkey and provide a server address:

```bash
export CACHE_TYPE=valkey
export VALKEY_ADDRESS=your-valkey-endpoint:6379
```

TLS is enabled by default for secure connections. Disable it only in development environments:

```bash
export VALKEY_TLS=false
```

See the [configuration reference](../reference/configuration#cache) for all available options.

## Deployment with AWS ElastiCache Serverless

AWS ElastiCache Serverless is recommended for production deployments. It provides automatic scaling without capacity planning.

Create an ElastiCache Serverless cache:

```bash
aws elasticache create-serverless-cache \
  --serverless-cache-name chinmina-cache \
  --engine valkey \
  --serverless-cache-usage-limits \
    DataStorage={Maximum=10,Unit=GB} \
    ECPUPerSecond={Maximum=5000}
```

Configure network access to allow connections from your Chinmina Bridge instances (for example, an ECS service). ElastiCache Serverless requires VPC configuration and security group rules permitting inbound traffic on port 6379.

Use the cache endpoint address in the `VALKEY_ADDRESS` configuration.

## Cache behavior

Cache keys include a digest of the configuration that produces each token. When configuration changes (such as organization profile updates), previously cached tokens are automatically invalidated.

Tokens are cached for 45 minutes by default, matching their GitHub API lifetime. Due to caching behavior, actual token lifetime may be as short as 43 minutes.

If the Valkey server becomes unavailable, Chinmina Bridge logs a warning and proceeds without caching. Requests continue to succeed by calling the GitHub API directly for each token request.

## Observability

When [observability](observability) is enabled, Chinmina Bridge exports OpenTelemetry metrics for cache operations:

- **Operation counts** by status (hit, miss, error) and backend type
- **Operation latency histograms** for both in-memory and distributed caches
- **Token cache outcomes** including repository mismatch detection

Use these metrics to monitor cache effectiveness, identify optimization opportunities, and detect edge cases in pipeline configurations.

## Limitations

Valkey must be deployed alongside your Chinmina Bridge infrastructure. It becomes an additional component in the critical path for token generation.

The Valkey server connection credentials must be managed securely. Currently, IAM authentication for AWS ElastiCache is not implemented.
