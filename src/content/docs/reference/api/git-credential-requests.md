---
title: Git credential request handling
description: How Chinmina Bridge evaluates a Git credential request, and the conditions that produce credentials, an empty response, or an error.
---

The Git credential endpoints share a single request handler. This page describes
the order in which a request is evaluated, and the conditions that produce
credentials, a successful empty response, or an error.

It applies to:

- [`POST /git-credentials` and `POST /git-credentials/{profile}`](/reference/api/pipeline-git-credentials)
- [`POST /organization/git-credentials/{profile}`](/reference/api/organization-git-credentials)

## Git protocol support

Chinmina Bridge implements the Git credential helper protocol natively, keeping
most of the logic out of any credential helper that exercises it. The
`protocol`, `host`, and `path` properties in a request body describe the
request's target: the URL Git is asking about.

The supplied target repository is not a security boundary. It exists so Chinmina
Bridge works within Git's credential chain, where a 200 carrying no properties
reads as a decline and Git moves on to the next configured helper for the
repository. Git ignores a helper's exit status, so an error in place of that
response does not stop the chain; it only adds the failure to the build log.

Authorization is determined by three controls:

- The `Authorization` header carries the Buildkite OIDC token which establishes the
  calling pipeline's identity. This is validated before the body is read.
- The profile's [match rules](/reference/profiles/matching) decide whether that
  pipeline may use the profile it named.
- The [profile's permissions](/reference/profiles) and the reach of the GitHub
  App installation bound what the issued token can do.

A target repository allows the request to be filtered according to the Git
credential helper protocol, so credential helpers function without spurious
error messages and the service telemetry stays clean. Caller-scoped organization
profiles are the only case where the target selects a repository, and the
selected repository must be one that the GitHub application has access to.

The Git-specific logic of these specialized handlers keeps more complicated
processing and quality testing central, rather than distributed to all
credential helper implementations.

The [`/token`](/reference/api/pipeline-token) and
[`/organization/token/{profile}`](/reference/api/organization-token) endpoints
return the same tokens in a generic JSON format and accept no Git credential
context, so none of the rules on this page apply to them.

## Evaluation order

Each stage either answers the request or passes it to the next.

```d2 title="Git credential request classification"
direction: right

classify: Requested target {
  complete: "protocol and host required"
  support: "https://github.com only"

  complete -> support: "both supplied"
}

serve: Profile and repository {
  resolve: Profile resolution
  match: Profile match rules
  repo: Repository matching
  mint: Token issuance

  resolve -> match -> repo -> mint
}

empty: "200, no credentials" {
  style.fill: "#e8f4ea"
}
creds: "200, credentials" {
  style.fill: "#e8f4ea"
}
bad: "400, incomplete target" {
  style.fill: "#f8eaea"
}
err: "Error" {
  style.fill: "#f8eaea"
}

classify.complete -> empty: "no target supplied"
classify.complete -> bad: "partly supplied"
classify.support -> empty: "unsupported destination"
classify.support -> serve.resolve
serve.repo -> empty: "repository not covered"
serve.mint -> creds
serve -> err: "profile, scope, or upstream failure"
```

| Stage                                                     | Outcome                                                   |
| --------------------------------------------------------- | -------------------------------------------------------------- |
| Routing                                                   | 404 when the method and path do not match a route              |
| Authentication                                            | 401 when the OIDC token is missing or invalid                  |
| [Property parsing](#property-parsing)                     | 413 when the body exceeds 20 KB, 500 on any other read failure |
| [Protocol and host required](#protocol-and-host-required) | 200 with no credentials, or 400                                |
| [GitHub repositories only](#github-repositories-only)     | 200 with no credentials                                        |
| Profile resolution                                        | 400, including an unresolved caller-scoped repository; 404 or 500 for other resolution failures |
| Profile match rules                                       | 403 when the caller may not use the profile                    |
| [Repository matching](#repository-matching)               | Continues on a match; 200 with no credentials on mismatch; 500 if the Buildkite repository lookup fails |
| Token issuance                                            | 200 with credentials; 403 when GitHub refuses; 500 on other upstream failures |

Authentication runs before the body is touched. The 20 KB body limit is
installed ahead of authentication, but only takes effect when the handler reads
the body, so an oversized request without a valid token returns 401 rather than 413.

Both checks on the requested target are settled before any profile lookup,
cache access, Buildkite repository lookup, or GitHub token mint. Their outcome
does not vary with the profile named, the cache state, or either upstream
service.

## Property parsing

The request body follows Git's
[credential helper input format](/reference/git-credentials-format#input-format).
Parsing is tolerant:

- Each line is split at the first `=`. The remainder of the line is the value.
- The first empty line terminates input. Anything after it is ignored.
- Lines with no `=`, or with an empty key, are discarded.
- A repeated key keeps the last value supplied.
- Properties Chinmina Bridge does not use are ignored.

A malformed line does not fail the request. A failure to read the body returns
413 when the body exceeded 20 KB, and 500 otherwise. Both carry the
`Chinmina-Denied` header.

## Protocol and host required

Requests generated by Git include `protocol` and `host`. A client calling the
endpoint directly may omit all three target properties: `protocol`, `host`, and
`path`.

A request that supplies no target at all is well formed but unfulfillable, and
returns 200 with no credentials. A request that supplies part of a target must
supply all of the required parts.

`path` is optional: Git omits it when
[`credential.useHttpPath`][use-http-path] is false. An omitted property and an
explicitly empty one (`host=`) are equivalent everywhere.

| `protocol` / `host` | Host omitted      | Host empty        | `github.com` | Other host |
| ------------------- | ----------------- | ----------------- | ------------ | ---------- |
| Protocol omitted    | Empty-target rule | Empty-target rule | 400          | 400        |
| Protocol empty      | Empty-target rule | Empty-target rule | 400          | 400        |
| `https`             | 400               | 400               | Continue     | 200 empty  |
| Other protocol      | 400               | 400               | 200 empty    | 200 empty  |

**Empty-target rule**: 200 with no credentials when `path` is also omitted or
empty, and 400 otherwise.

Consequences:

- An empty body returns 200 with no credentials, as does a body containing only
  properties that supply no target, such as `username` and `password`.
- A path on its own returns 400. `path=owner/repository` and `path=/` both
  supply target information, and neither substitutes for a missing `protocol`
  or `host`.
- A request with an unsupported protocol and no host returns 400. Completeness
  is checked before destination support.
- No whitespace is trimmed. A property valued with a space counts as supplied.

## GitHub repositories only

Chinmina Bridge issues credentials for exactly one destination: `protocol=https`
with `host=github.com`. The supplied values are compared literally. Any other
non-empty pair returns 200 with no credentials, which allows another credential
helper to answer for that destination.

No normalisation is applied, so none of the following are accepted spellings of
the supported pair:

| Property value        | Reason                        |
| --------------------- | ----------------------------- |
| `protocol=HTTPS`      | Case is significant           |
| `host=GitHub.com`     | Case is significant           |
| `host=github.com:443` | Ports are not removed         |
| `host=github.com.`    | Trailing dots are not removed |
| `host=` plus spaces   | Whitespace is not trimmed     |

An unsupported destination is classified before the requested profile is
resolved, so the profile is never consulted. An unknown profile name, or one the
caller may not use, still returns 200 with no credentials.

## Repository matching

Once the destination is supported, the outcome depends on the `path` property
and the kind of profile named by the request.

| Requested `path`                        | Pipeline profile | Static organization profile | Caller-scoped organization profile | Wildcard organization profile |
| --------------------------------------- | ---------------- | --------------------------- | ---------------------------------- | ----------------------------- |
| Omitted or empty                        | 200 empty        | 200 empty                   | 400                                | Credentials                   |
| Root (`/`)                              | 200 empty        | 200 empty                   | 400                                | Credentials                   |
| Owner only, with or without slashes     | 200 empty        | 200 empty                   | 400                                | Credentials                   |
| A repository the profile covers         | Credentials      | Credentials                 | Credentials                        | Credentials                   |
| A repository the profile does not cover | 200 empty        | 200 empty                   | Credentials                        | Credentials                   |

### Pipeline profiles

A [pipeline profile](/reference/profiles/pipeline) covers the repository
Buildkite reports for the authenticated pipeline, and the reconstructed request
URL must equal that repository's URL. An SSH-form repository is translated to
HTTPS before the comparison, which is otherwise exact. A failed Buildkite
lookup returns 500 rather than an empty response.

### Static organization profiles

A static [organization profile](/reference/profiles/organization) covers the
repositories named in its `repositories` list, and the repository name from the
request must appear there. Only the name is compared, with a `.git` suffix
removed and the owner ignored. The GitHub App installation's reach determines
which repositories the token can actually be used for.

### Caller-scoped organization profiles

A [caller-scoped
profile](/reference/profiles/organization#caller-scoped-repositories) covers
every repository derivable from `path`, and scopes its token to the name
derived. A path that derives no name returns 400 with `repository scope is
required for this profile`. Omitted, empty, root, and owner-only paths derive
nothing, as do paths whose repository component contains a further `/`,
whitespace, or control characters.

### Wildcard organization profiles

Every repository the installation can reach is covered, including a request that
supplies no path at all. A host-only request returns credentials scoped to the
whole installation.

The `repository-scope` query parameter is read on
[`POST /organization/token/{profile}`](/reference/api/organization-token) only.
It is ignored by the Git credential endpoints, which derive scope from `path`.

## Response shapes

### Credentials (200)

Credential properties in
[Git's output format](/reference/git-credentials-format#output-format). The
individual endpoint pages document the properties returned.

### No credentials (200)

`Content-Type: text/plain`, `Content-Length: 0`, an empty body, and no
`Chinmina-Denied` header. Git treats this as "this helper has nothing for that
URL" and moves on to the next configured helper. Empty target, unsupported
destination, and repository mismatch all produce the same response.

### Incomplete target (400)

`Content-Type: text/plain; charset=utf-8` and a body of `Bad Request`, with no
`Chinmina-Denied` header. This shape is unique to an incomplete target.

### Other errors

An empty body and a caller-facing reason in the `Chinmina-Denied` header, with
the full cause recorded in the [audit log](/reference/auditing). Authentication
failures are the exception: the middleware answers with a JSON body and a
`WWW-Authenticate` header. The endpoint pages list the statuses and their
conditions.

## Audit records

Every request is audited, including those answered before profile resolution.

- A response carrying no credentials records
  `skipped(success): no credentials for requested context` as its error value.
  The value records a success, and applies equally to an empty target, an
  unsupported destination, and a repository mismatch.
- The requested repository is recorded as the URL reconstructed from the
  supplied properties, including for an unsupported destination. An empty
  target has no requested repository, and an incomplete target records none.
- A request answered before profile resolution records the profile name it
  asked for, and no resolved profile, App, or token metadata.

[use-http-path]: https://git-scm.com/docs/gitcredentials#Documentation/gitcredentials.txt-credentialuseHttpPath
