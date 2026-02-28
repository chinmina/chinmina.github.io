---
title: Deployment example
description: An example Chinmina infrastructure deployment on AWS
---

This document describes how an example organization deploys Chinmina, showing the infrastructure components and their relationships.

## Infrastructure overview

The organization runs Chinmina on AWS within a dedicated VPC. The service runs as an ECS Fargate task in a Chainguard static container as a non-root user, serving Buildkite agents that run on EC2 instances in the same VPC.

```d2 sketch=true title="Example Chinmina deployment architecture"
direction: down

cloud-services: External services {
  style.stroke: "#888"
  style.fill: "#f5f5f5"

  config-repo: "Chinmina profile config\n(configuration repository)" {
    shape: cylinder
  }

  github: "GitHub App\n(installed in org)" {
    shape: cloud
  }

  buildkite: "Buildkite\nControl Plane" {
    shape: cloud
  }
}

aws: AWS {
  kms: "AWS KMS\nGitHub App Private Key\n(sign/verify only)" {
    shape: cylinder
  }

  vpc: VPC {
    style.stroke: "#888"
    style.fill: "#f5f5f5"

    agent: "Buildkite Agent\n(EC2 Process)" {
      shape: rectangle
    }

    chinmina: "Chinmina Service\n(ECS Fargate)" {
      style.stroke: "#bd009a"
      shape: rectangle
    }

    sg-note: "(Security Groups:\nChinmina SG allows inbound\nfrom Agent Marker SG)" {
      shape: text
      style.font-color: "#666"
    }
  }
}

# Buildkite control plane
cloud-services.buildkite -> aws.vpc.agent: schedule jobs
aws.vpc.agent -> cloud-services.buildkite: request OIDC token

# Agent to Chinmina
aws.vpc.agent -> aws.vpc.chinmina: HTTPS + OIDC token

# Chinmina to GitHub
aws.vpc.chinmina -> cloud-services.github: request ephemeral\napp token

# Chinmina to KMS
aws.kms <- aws.vpc.chinmina: sign requests only\n(no key extraction)

# Configuration
aws.vpc.chinmina -> cloud-services.config-repo: read profiles
```

## Authentication flow

The authentication and token generation process involves multiple steps across Buildkite, Chinmina, and GitHub.

### OIDC token generation

The Buildkite agent uses an OIDC token to authenticate with Chinmina. This token is created by the Buildkite control plane using the current [job token][buildkite-job-token]. The job token is derived for the current job and has a limited lifetime, typically valid until the job finishes.

The OIDC token is a JWT containing claims about the pipeline, build, and job context. Example decoded token:

```json
{
  "iss": "https://agent.buildkite.com",
  "sub": "organization:example-org:pipeline:example-service:ref:refs/heads/main:commit:9f3182061f1e2cca4702c368cbc039b7dc9d4485:step:deploy",
  "aud": "chinmina:example-org",
  "iat": 1669014898,
  "nbf": 1669014898,
  "exp": 1669015198,
  "organization_slug": "example-org",
  "pipeline_slug": "example-service",
  "build_number": 42,
  "build_branch": "main",
  "build_commit": "9f3182061f1e2cca4702c368cbc039b7dc9d4485",
  "step_key": "deploy",
  "job_id": "0184990a-477b-4fa8-9968-496074483cee",
  "agent_id": "0184990a-4782-42b5-afc1-16715b10b8ff"
}
```

Chinmina validates the token signature, checks the audience matches its configuration, and extracts claims to determine the requesting pipeline's identity and context. These claims are then used to look up the appropriate profile and permissions.

### Token request sequence

```d2 sketch=true title="Token request flow"
shape: sequence_diagram

agent: Buildkite Agent
buildkite: Buildkite API
chinmina: Chinmina Service
audit: Audit Log
config: Config Repo
kms: AWS KMS
github: GitHub API

# Job execution starts
buildkite.schedule -> agent.job: schedule job

# Agent requests OIDC token
agent.job -> buildkite.oidc: request OIDC token\nfor current job
agent.job <- buildkite.oidc: OIDC token (JWT)

# Agent calls Chinmina with OIDC token
agent.job -> chinmina.auth: request GitHub token\n(with OIDC token)

# Chinmina validates and determines permissions
chinmina.auth -> chinmina.claims: validate OIDC token\nextract claims
chinmina.claims -> config.lookup: lookup profile\nfor pipeline
chinmina.claims <- config.lookup: profile permissions

# Chinmina requests signing from KMS
chinmina.claims -> kms.sign: sign JWT that authorizes\nGitHub API call\n(using private key)
chinmina.claims <- kms.sign: signed JWT

# Chinmina requests token from GitHub
chinmina.claims -> github.token: request application\ninstallation token\n(with signed JWT)
chinmina.claims <- github.token: installation token\nfor pipeline\n(with permissions)

# Chinmina writes audit log
chinmina.claims -> audit.write: log request\n(success/failure)

# Chinmina returns token to agent
agent.job <- chinmina.auth: GitHub token\n(expires in 1 hour)
```

### Repository resolution

Chinmina determines which GitHub repository corresponds to a pipeline by calling the Buildkite API. The OIDC token claims identify the pipeline, and Chinmina queries the Buildkite API to retrieve the repository configuration for that pipeline.

### Token caching and lifetime

GitHub installation tokens have a one-hour lifetime. Chinmina caches these tokens in memory for up to 15 minutes to reduce load on GitHub API and KMS services.

Cached tokens are reused for:

- Pipeline profiles: tokens for the same pipeline and profile combination
- Organization profiles: tokens for the same organization profile

This caching provides performance benefits and resilience to brief service interruptions. Typical request latencies:

- Cached token: ~50 microseconds
- Uncached token: ~150 milliseconds

## Security controls

### Network isolation

The Chinmina service only accepts requests from Buildkite agents through security group controls. Chinmina's security group allows inbound traffic exclusively from the agents' security group (the "marker" security group).

### IAM and KMS

The GitHub App private key is stored in AWS KMS with the "signing" key type. The key's resource policy restricts signing operations to the Chinmina ECS task role only.

The private key is used to sign a JWT that authorizes the GitHub API call to generate the required application installation token for a pipeline.

KMS does not allow extraction of the private key material. The Chinmina service can only use the key to sign requests, preventing key compromise even if the service is breached.

### Container security

Chinmina runs in a Chainguard static container containing only the executable and its runtime dependencies. The container runs as a non-root user. This minimal attack surface and reduced privilege level limit vulnerability exposure.

### Audit logging

All token requests are logged to stdout at the `audit` log level with success or failure status. These audit logs provide non-repudiation for the system and cannot be disabled. Logs are forwarded to the organization's log aggregation platform for centralized monitoring and analysis.

Example audit log entry:

```json
{
  "level": "audit",
  "request": {
    "method": "POST",
    "path": "/token",
    "status": 200,
    "sourceIP": "10.0.1.42:34340",
    "userAgent": "curl/8.3.0"
  },
  "pipeline": {
    "organizationSlug": "example-org",
    "pipelineSlug": "example-service",
    "buildNumber": 42,
    "buildBranch": "main"
  },
  "authorization": {
    "authorized": true,
    "subject": "organization:example-org:pipeline:example-service:ref:refs/heads/main:commit:abc123def:step:deploy",
    "issuer": "https://agent.buildkite.com",
    "audience": ["chinmina:example-org"],
    "expiry": "2026-01-12T23:35:42Z",
    "expiryRemaining": 299
  },
  "token": {
    "repositories": ["https://github.com/example-org/example-service.git"],
    "permissions": ["contents:read", "metadata:read"],
    "expiry": "2026-01-12T23:45:42Z",
    "expiryRemaining": 599
  },
  "type": "audit",
  "time": "2026-01-12T22:35:42Z",
  "message": "audit_event"
}
```

## Configuration management

Chinmina profile configurations are stored in a configuration repository as YAML files. These profiles define:

1. The default permissions vended for a pipeline
2. Specific sets of permissions that can be requested by a pipeline:
   - Permissions that apply to the pipeline's repository, or
   - Permissions that apply to a defined set of repositories

The Chinmina service reads these configurations to determine what permissions to request when generating tokens for authenticated pipelines.

Example profile configuration:

```yaml
pipeline:
  # Default permissions for all pipelines
  defaults:
    permissions: ["contents:read"]

  profiles:
    # Pipeline-specific profile for commenting on PRs
    - name: "pr-commenter"
      permissions: ["contents:read", "pull_requests:write"]

    # Only main branch can publish releases
    - name: "release-publisher"
      match:
        - claim: build_branch
          value: "main"
      permissions: ["contents:write"]

organization:
  profiles:
    # Organization-wide profile for accessing buildkite plugins
    - name: "buildkite-plugin"
      repositories:
        - somewhat-private-buildkite-plugin
        - very-private-buildkite-plugin
      permissions: ["contents:read"]

    # Allow package access to any repository
    - name: "package-registry"
      repositories: ["*"]
      permissions: ["packages:read"]
```

## Operational considerations

### High availability

The deployment uses a single ECS Fargate instance behind an Application Load Balancer (ALB). If the container crashes, the ECS service automatically restarts it.

### Performance

The service handles concurrent requests efficiently. Request latency depends on cache status:

- Cached token requests: ~50 microseconds
- Uncached token requests: ~150 milliseconds (includes KMS signing and GitHub API calls)

### Monitoring and alerting

The organization monitors Chinmina with Service Level Objectives (SLOs) configured on their monitoring platform for:

- Token vending error rates
- Request latency

### Log aggregation

All logs are forwarded to the organization's log aggregation platform using standard log forwarding infrastructure. This includes both operational logs and audit logs, providing centralized visibility into service behavior and token requests.

## Failure modes and resilience

### KMS unavailability

KMS unavailability stops token generation for new requests. However, Chinmina creates JWTs with approximately 30-minute lifetimes and reuses them within that period, providing resilience to brief KMS outages. Cached GitHub tokens (up to 15 minutes) provide additional buffer.

### GitHub API failures

GitHub API failures directly impact pipelines unless the requested token exists in the cache. The 15-minute cache window provides partial resilience to GitHub outages for repeated requests.

### Profile lookup failures

Profile-related failures return HTTP status codes:

- `404`: requested profile does not exist in configuration
- `403`: profile exists but the pipeline is not authorized to use it (match conditions not met)

### Buildkite API unavailability

Repository resolution requires the Buildkite API. If unavailable, Chinmina cannot determine the repository for pipeline-based token requests. Organization profile requests are not affected as they specify repositories explicitly in the profile configuration.

## Dependencies

Chinmina requires these services to be operational:

**Core infrastructure:**

- AWS ECS (service hosting)
- AWS ECR (container image storage)
- AWS KMS (private key signing)
- AWS IAM (authorization)
- Application Load Balancer (request routing)

**External services:**

- Buildkite control plane (job scheduling and OIDC token generation)
- Buildkite API (pipeline repository resolution)
- GitHub API (installation token generation)
- GitHub Git (profile configuration access in configuration repository)

Service degradation or outages in any of these dependencies will impact Chinmina's ability to vend tokens, though caching provides limited resilience for repeated requests.

[buildkite-job-token]: https://buildkite.com/docs/agent/v3/tokens#additional-agent-tokens-token-exchange-process
