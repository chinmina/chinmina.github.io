---
title: Getting started
description: What you need to prepare to get Chinmina going.
---

Requirements:

1. A Buildkite organization, and a user with sufficient access to create an API
   token that can be used to get the details of any pipeline that is expected to
   be built.
1. A Github organization, and a user with sufficient permissions to create a
   Github App and install it into the organization.
1. Ability to deploy a server that can be accessed by the build agents (for example, an ECS service)
1. Ability to allow Buildkite agents to download and use a custom plugin _or_
   ability to add a plugin to the default settings of the Buildkite agents.

### Buildkite setup

Create an API key with access to the REST API **only** with access to the `read_pipelines` scope.

Save the key securely: it will be provided to the server in a later step. Use a
"bot" user to create the token if you can.

### Github setup

1. Create an application in your Github organization
   - The application must request `contents:read`
   - Note the application ID
   - Create and save a private key for the application
2. Install the application into the Github organization
   - choose the repositories the application will have access to. This is the
     limit of the resources that the application can vend tokens for.

### Configure and deploy the bridge server

The server is a Go application expecting to read configuration from environment
variables, and can be deployed to a server or as a container.

#### Variables

**Server**

- `SERVER_PORT` (optional, default `8080`): the TCP port the server will listen on.
- `SERVER_SHUTDOWN_TIMEOUT_SECS` (optional, default `25`): the number of seconds
  the server will wait when asked to terminate with `SIGINT`

**Authorization**

- `JWT_BUILDKITE_ORGANIZATION_SLUG` (**required**): the slug of your Buildkite
  organization. This is the identifier of your organization that appears in your
  Buildkite URLs.
- `JWT_AUDIENCE` (optional, default=`app-token-issuer`): The expected value of the
  `aud` claim in the JWT. Describes the intended audience of the issued JWT
  token, guards against token reuse. Using a non-default value will require configuration of the credentials helper plugin.
- `JWT_ISSUER_URL` (optional, default `https://agent.buildkite.com`): the
  expected value of the `iss` claim in the agent JWT. Also used to discover the
  JWKS configuration from the `.well-known` address.
- `JWT_JWKS_STATIC` (optional): a local JWKS JSON file that can be used instead
  of Buildkite. Used to verify the JWT sent by the Buildkite agents to the
  server. This should only be required for server testing, as agents will only
  create a token using the Buildkite key.

**Buildkite API**

- `BUILDKITE_API_TOKEN` (**required**): The API token created for pipeline
  metadata lookups. **Store securely and provide to the container securely.**

**GitHub API connectivity**

- `GITHUB_APP_PRIVATE_KEY` (**required**): The PEM formatted private key of the
  created Github app. **Store securely and provide to the container securely.**
  This is a highly sensitive credential.
- `GITHUB_APP_ID` (**required**): The application ID of the Github application
  created above.
- `GITHUB_APP_INSTALLATION_ID` (**required**): The installation ID of the
  created Github application into your organization.
