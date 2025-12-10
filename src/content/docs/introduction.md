---
title: Introduction
description: The what and why of Chinmina Bridge
---

**Connect Buildkite to GitHub with secure, short-lived tokens.**

Chinmina Bridge is a simple web service that acts as an intermediary between a
Buildkite installation and a related [GitHub App][github-app]. Buildkite agents
can request [ephemeral GitHub access tokens][github-app-tokens] from Chinmina
Bridge, removing the need to store Deploy Keys or Personal Access Tokens long
term.

![Buildkite connecting to GitHub via Chinmina](../../assets/chinmina-high-level.png)

## Benefits

There are substantial security and flexibility benefits when Chinmina Bridge is
integrated with your Buildkite stack, as outlined below. While initial
deployment is not trivial, it provides a level of auditability and manageability
that isn't present in the standard Buildkite/GitHub integration that makes
Chinmina ideal for scaling Buildkite deployments from a handful to hundreds of
repositories.

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
   storage is required in secrets or S3, and nothing to manage per-repository in
   GitHub.

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

1. Chinmina is not available as a cloud offering: it needs to be self-hosted and
   reachable by the Buildkite agent infrastructure. It is a single point of
   failure in the system also, and critical to keep up. Given that it is a
   simple, containerized HTTP service with Open Telemetry support and easy
   scaling, this is thankfully relatively straightforward.

2. The private key for the GitHub application is quite powerful, and needs to be
   carefully protected. It has the superset of permissions that it can delegate.
   Storing the key in AWS KMS and using careful resource and IAM policies on
   access is therefore [strongly recommended](guides/kms).

3. Adequate controls are required on Buildkite pipeline creation. At present,
   the bridge will allow access by the pipeline to the configured repository.
   Controls are required to ensure that repository access is appropriately
   limited.[^1]

[^1]: Changing this behaviour is on the road map. In upcoming releases, you will be able to require some central configuration will be required in order to enable repository access.

## How it works

Chinmina Bridge accepts HTTP connections from Buildkite agents. GitHub tokens
are requested from one of the available [endpoints](#endpoints) using [Buildkite
OIDC][buildkite-oidc] token for authorization.

GitHub tokens vended by Chinmina have a maximum lifetime of an hour. Chinmina
will cache tokens internally for up to 15 minutes, so the token received by an
agent will have an effective lifetime of between 45 and 60 minutes.

### Pipeline-based

This is the simplest way of working with Chinmina, where a token is retrieved
for the repository linked to the pipeline that is running the current build.
This is a direct replacement for the deploy key or PAT that would be required
instead.

Requests to `/token` and `/git-credentials` are authorized with the [Buildkite
OIDC][buildkite-oidc] token, whose claims identify the executing pipeline. From
the pipeline, the associated GitHub repository is looked up, and a token with
`contents:read` permission is returned for that repository.

### Organization profiles

If the `/organization/*` routes are used, Chinmina will use the [organization
profile][org-profile] to determine the repositories and permissions for the
GitHub token (after authorizing the request).

## Endpoints

Five endpoints are exposed:

- `/token`, which returns a token and its expiry
- `/organization/token/{profile}`, which returns a token and its expiry for a given organization profile
- `/git-credentials`, which returns the token and repository metadata in the
  [Git Credentials format][git-credential-helper].
- `/organization/git-credentials/{profile}`, which returns the token and repository metadata in the
  [Git Credentials format][git-credential-helper] for a given [organization profile][org-profile].
- `/healthcheck`, which returns 200. It is used for healthcheck requests from
  load balancers and the like.

[github-app]: https://docs.github.com/en/apps
[github-app-tokens]: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app
[buildkite-oidc]: https://buildkite.com/docs/agent/v3/cli-oidc
[git-credential-helper]: https://git-scm.com/docs/gitcredentials#_custom_helpers
[org-profile]: reference/organization-profile
