---
title: Introduction
description: A reference page in my new Starlight docs site.
---

**Connect Buildkite to GitHub with secure, short-lived tokens.**

Chinmina Bridge is a simple web service that acts as an intermediary between a
Buildkite installation and a related [GitHub App][github-app]. Buildkite agents can request
[ephemeral GitHub access tokens][github-app-tokens] from Chinmina Bridge, removing the need to store
Deploy Keys or Personal Access Tokens long term.

![Buildkite connecting to GitHub via Chinmina](../../assets/chinmina-high-level.png)

## Benefits

There are two substantial benefits when Chinmina Bridge is integrated with your Buildkite stack:

### Security

1. Access tokens for the repository have a lifetime of one hour and only provide
   read access to the pipeline repository. There is no token to store and
   refresh: it's entirely automatic.

2. Issuing [deploy keys per
   repository](https://buildkite.com/docs/agent/v3/github-ssh-keys) is no longer
   required. Deploy keys are long-lived credentials that require elevated
   repository permissions, and keys issued to individuals have a higher
   potential to be accidentally leaked.

3. The GitHub app private key is the only key that is stored: no other token
   storage is required.

4. With KMS, the highly sensitive private key cannot be extracted. When
   configured [as described in our guide](guides/kms), the Chinmina service uses
   KMS to sign the GitHub JWT, and never has access to the raw key material.

5. [Audit-friendly logs are written](guides/observability) for each token
   request, whether successful or unsuccessful. These can be readily connected
   to your SIEM system, adding transparency and traceability to the system.

### Flexibility

Once configured, Buildkite pipelines get automatic read access to their source
repository. This reduces complexity in the provisioning process.

## Drawbacks

1. Chinmina needs to be self-hosted alongside the Buildkite agent
   infrastructure. It is a single point of failure in the system also, and
   critical to keep up. Given that it is a simple, containerized HTTP service
   with Open Telemetry support, this is thankfully relatively straightforward.

2. The private key for the GitHub application is quite powerful, and needs to be
   carefully protected. It has the superset of permissions that it can delegate.
   Storing the key in AWS KMS and using careful resource and IAM policies on
   access is therefore [strongly recommended](guides/kms).

3. Adequate controls are required on Buildkite pipeline creation. At present,
   the bridge will allow access by the pipeline to the configured repository.
   Controls are required to ensure that repository access is appropriately
   limited.[^1]

[^1]:
    Changing this behaviour is a short-term goal. In upcoming releases,
    configuration will be required in order to enable repository access.

## How it works

Chinmina Bridge accepts HTTP connections from Buildkite agents. The request
includes a [Buildkite OIDC][buildkite-oidc] token that is used to authorize
requests.

### No organization profile (default)

> [!TIP]
> This is Chinmina's default behaviour. Unless you've explicitly configured [organization profiles](reference/organization-profile),
> you should expect Chinmina to behave as described below.

If no organization profile is specified, the Buildkite OIDC token identifies the Buildkite
pipeline that is executing, so the associated repository can be looked up. If the associated and requested repositories match,
the request is valid.

For valid requests, GitHub is used to create an app token with `contents:read` permissions for the pipeline's repository.

### Organization profile

If an organization profile is specified, Chinmina verifies that the requested repository is allow-listed in the specified profile's config.

For valid requests, GitHub is used to create an app token with permissions specified by the profile's config for the requested repository.

> [!NOTE]
> In both scenarios, tokens vended by Chinmina have a maxiumum lifetime of an hour (due to caching it may only last for 45 minutes however).

## Endpoints

Five endpoints are exposed:

- `/token`, which returns a token and its expiry
- `/organization/token/{profile}`, which returns a token and its expiry for a given organization profile
- `/git-credentials`, which returns the token and repository metadata in the
  [Git Credentials format][git-credential-helper].
- `/organization/git-credentials/{profile}`, which returns the token and repository metadata in the
  [Git Credentials format][git-credential-helper] for a given organization profile.
- `/healthcheck`, which returns 200. It is used for healthcheck requests from
  load balancers and the like.

[github-app]: https://docs.github.com/en/apps
[github-app-tokens]: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app
[buildkite-oidc]: https://buildkite.com/docs/agent/v3/cli-oidc
[git-credential-helper]: https://git-scm.com/docs/gitcredentials#_custom_helpers
