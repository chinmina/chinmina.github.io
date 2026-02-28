---
title: Configuration
description: Details of all configuration options available.
---

Chinmina uses environment variables for all configuration, as it is expected that it will be deployed in a container runtime.

## Server

Configuration related to the core HTTP service.

###### `SERVER_PORT`

_(default: `8080`)_

The port that the Chinmina service will bind to on startup.

###### `SERVER_SHUTDOWN_TIMEOUT_SECS`

_(default: `25`)_

The number of seconds the server will wait for existing requests to complete
when shutting down. Shutdown will occur once requests complete or the timeout
occurs; whichever comes first.

###### `SERVER_OUTGOING_MAX_IDLE_CONNS`

_(default: `100`)_

For outgoing HTTPS requests, the maximum total number of idle connections that
are allowed.

###### `SERVER_OUTGOING_MAX_CONNS_PER_HOST`

_(default: `20`)_

For outgoing HTTPS requests, the maximum connections that may be made per host.
Given that Chinmina mainly targets Buildkite and GitHub API endpoints, this
number is somewhat higher than might otherwise be usual.

## Cache

Chinmina caches GitHub access tokens to reduce API calls. By default, tokens are
cached in-process memory. For multi-instance deployments, a shared
[Valkey](https://valkey.io/) cache can be used instead, with optional encryption
for tokens at rest.

When using Valkey, Chinmina uses a multi-level cache combining a fast local
in-memory cache with the distributed second level cache.

###### `CACHE_TYPE`

_(options: `memory | valkey` default: `memory`)_

The cache backend to use. `memory` uses an in-process LRU cache. `valkey` uses a
multi-level strategy combining an in-memory cache with the Valkey (or
Redis-compatible) server, allowing cached tokens to be shared across multiple
instances.

### Valkey

These settings apply only when `CACHE_TYPE` is `valkey`.

:::note[Important]

When using distributed caching, cache encryption should be enabled. This reduces
the risk of a compromised Valkey instance leaking credentials, as the encryption
keys would also need to be compromised.

:::

###### `VALKEY_ADDRESS` :badge[required]

The Valkey server address in `host:port` format. Required when `CACHE_TYPE` is
`valkey`.

###### `VALKEY_TLS`

_(default: `true`)_

Enable TLS for the Valkey connection (minimum TLS 1.2). Disable only for local
development.

###### `VALKEY_USERNAME`

Username for Valkey authentication. Leave unset if the server does not require
authentication. When IAM authentication is enabled, this is required as the IAM
user ID.

###### `VALKEY_PASSWORD`

Password for Valkey authentication. Must be empty when IAM authentication is
enabled.

### IAM authentication

For AWS ElastiCache deployments, IAM-based authentication can replace static
credentials. When IAM is enabled, TLS is forced on regardless of the
`VALKEY_TLS` setting.

###### `VALKEY_IAM_ENABLED`

_(default: `false`)_

Enable IAM-based authentication for AWS ElastiCache. Requires `VALKEY_USERNAME`
to be set (as the IAM user ID) and `VALKEY_PASSWORD` to be empty.

###### `VALKEY_IAM_CACHE_NAME`

The ElastiCache replication group ID or serverless cache name. Required when
`VALKEY_IAM_ENABLED` is `true`.

###### `VALKEY_IAM_SERVERLESS`

_(default: `false`)_

Mark the target as an ElastiCache serverless cache. Only relevant when
`VALKEY_IAM_ENABLED` is `true`.

### Cache encryption

Optional encryption for cached tokens stored in Valkey. Only applicable when
`CACHE_TYPE` is `valkey`. Uses [Tink](https://developers.google.com/tink) for
AEAD (Authenticated Encryption with Associated Data), binding each cached value
to its cache key to prevent ciphertext substitution.

Encryption keys are automatically refreshed every 15 minutes. If a refresh fails,
the service continues with the current key.

Two keyset sources are available. Use **either** the AWS configuration (recommended
for production) **or** the file-based configuration (local development only), not
both.

###### `CACHE_ENCRYPTION_ENABLED`

_(default: `false`)_

Enable encryption of cached tokens. Requires `CACHE_TYPE` to be `valkey`.

#### AWS keyset

For production use. The keyset is stored in AWS Secrets Manager and protected by
an AWS KMS key for envelope encryption. Both variables must be set together.

###### `CACHE_ENCRYPTION_KEYSET_URI`

The Secrets Manager URI for the Tink keyset, in the format
`aws-secretsmanager://secret-name`.

###### `CACHE_ENCRYPTION_KMS_ENVELOPE_KEY_URI`

The KMS key URI used for envelope encryption, in the format
`aws-kms://arn:aws:kms:region:account:key/key-id`.

#### File keyset

For local development only. The keyset is stored as a cleartext JSON file.

###### `CACHE_ENCRYPTION_KEYSET_FILE`

Path to a cleartext Tink keyset JSON file. Mutually exclusive with
`CACHE_ENCRYPTION_KEYSET_URI` and `CACHE_ENCRYPTION_KMS_ENVELOPE_KEY_URI`.

## Buildkite OIDC

###### `JWT_BUILDKITE_ORGANIZATION_SLUG` :badge[required]

The organization slug for your Buildkite organization. This slug is used for API
calls, and verifying OIDC tokens on incoming requests.

###### `JWT_AUDIENCE`

_(default: `app-token-issuer`)_

The audience that is expected on incoming OIDC tokens. This value must be supplied to `buildkite-agent oidc create`.

:::tip

Recommendation: `chinmina:your-github-organization`. This is specific to the
purpose of the token, and also scoped to the GitHub organization that tokens
will be vended for. `chinmina-bridge`'s GitHub app is configured for a
particular GitHub organization/user, so if you have multiple organizations,
multiple agents will need to be running.

:::

### Development settings

The following JWT settings are generally development only. In production, it's
expected that the default behaviour of retrieving the `jwks.json` directly from
Buildkite will be the preferred method.

###### `JWT_JWKS_STATIC`

A static literal JWKS file for local testing. Use "make keygen" to generate a new key pair.

The local `.envrc.local` file can reference the generated key as follows:

```bash
jwks="$(cat .development/keys/jwk-sig-testing-pub.json)"
export JWT_JWKS_STATIC="${jwks}"
```

###### `JWT_ISSUER_URL`

_(default: `https://agent.buildkite.com`)_

Testing only. The issuer URL expected on incoming OIDC JWT tokens.

## Buildkite API

###### `BUILDKITE_API_TOKEN` :badge[required]

The Buildkite token used to access the Buildkite REST API. Should only be
supplied the `read_pipelines` scope.

## GitHub API

:::tip

Either `GITHUB_APP_PRIVATE_KEY` or `GITHUB_APP_PRIVATE_KEY_ARN` is required.

`GITHUB_APP_PRIVATE_KEY_ARN` is strongly recommended where possible (see [KMS configuration](../../guides/kms)).

:::

###### `GITHUB_APP_PRIVATE_KEY` :badge[required]

The GitHub Application private key in PEM format, supplied as text (not a file path).

###### `GITHUB_APP_PRIVATE_KEY_ARN` :badge[required]

The AWS KMS key (or alias) resource ARN that has been configured for use by Chinmina.

See the [AWS KMS setup and configuration](../../guides/kms) guide for more details.

###### `GITHUB_APP_ID` :badge[required]

GitHub App ID of the app itself.

###### `GITHUB_APP_INSTALLATION_ID` :badge[required]

The ID for the installation of the App in your organization.

###### `GITHUB_ORG_PROFILE`

The location of your profile configuration file, if in use. This should be a triplet
of the form `<OWNER>:<REPO>:<PATH_TO_FILE>`. No other format is accepted.

The profile configuration file contains both [pipeline profiles][pipeline-profile-config] and [organization profiles][org-profile-config].

The source file for profiles **must** be configured as below. If the download or validation steps fail, the server will start but no profiles will be available.

1. The GitHub application for Chinmina has read access to the repository hosting the file
2. The profile configuration file content must conform to the [profile configuration format][profiles-config].

## Open Telemetry

###### `OBSERVE_ENABLED`

_(default: `false`)_

When `true`, Open Telemetry traces and metrics will be published on the
configured transport type (see `OBSERVE_TYPE`).

###### `OBSERVE_METRICS_ENABLED`

_(default: `true`)_

If the Open Telemetry target does not support metrics (e.g. Jaeger), set this to
`false`. Only relevant when `OBSERVE_ENABLED` is true.

###### `OBSERVE_TYPE`

_(options: `grpc | stdout` default: `grpc`)_

Set the outgoing transport to use for telemetry. GRPC is the default; `stdout`
is only really useful for development situations where a telemetry server is not
available.

###### `OBSERVE_OTEL_LOG_LEVEL`

_(options: `debug | info | warn` default: `info`)_

Configure internal Open Telemetry SDK logging. Any invalid value will be
interpreted as disabled.

###### `OBSERVE_SERVICE_NAME`

_(default: `chinmina-bridge`)_

The identifying service name reported in traces and metrics.

###### `OBSERVE_TRACE_BATCH_TIMEOUT_SECS`

_(default: `20`)_

The number of seconds to wait for a batch of spans before sending to the
collector.

###### `OBSERVE_METRIC_READ_INTERVAL_SECS`

_(default: `60`)_

The number of seconds to wait between metric read and send attempts. A shorter
interval may be desirable in testing, or when higher precision is required.

###### `OBSERVE_HTTP_TRANSPORT_ENABLED`

_(default: `true`)_

If `OBSERVE_ENABLED` is also true, enable sub-traces for all outgoing HTTP
requests. This allows tracing of Buildkite and GitHub API traffic. This is very
useful, but for some providers who charge by the number of spans, this may be
a costly operation.

###### `OBSERVE_CONNECTION_TRACE_ENABLED`

_(default: `true`)_

When true, outgoing HTTP requests will be annotated with details of the
connection process, e.g. DNS lookup time. Only effective when HTTP transport
tracing is enabled.

###### `OTEL_EXPORTER_OTLP_ENDPOINT`

_(default: `http://localhost:4317`)_

The endpoint to which traces and metrics will be sent.

:::tip

Standard Open Telemetry configuration is supported. See the Open
Telemetry [exporter configuration][otel-exporter-config] for all configuration
variables available.

:::

[otel-exporter-config]: https://opentelemetry.io/docs/specs/otel/protocol/exporter/#configuration-options
[profiles-config]: profiles/
[pipeline-profile-config]: profiles/pipeline
[org-profile-config]: profiles/organization
