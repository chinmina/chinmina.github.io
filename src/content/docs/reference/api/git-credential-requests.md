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

## Protocol integration, not authorization

Chinmina Bridge implements the Git credential helper protocol natively, so Git
calls it directly rather than through a script that translates between formats.
The `protocol`, `host` and `path` properties in a request body describe the
request's target: the URL Git is asking about.

Those properties exist so that Chinmina Bridge behaves as a well-formed
credential helper. They are not a security boundary. The empty response is the
clearest case: Git reads a 200 carrying no properties as "this helper has
nothing for that URL" and moves on to the next helper in its chain, which is how
several helpers coexist for one repository. An error in its place would end the
operation instead, because the credential helper treats a failed HTTP request as
a failure rather than a decline.

Three controls decide what a caller may receive, and none of them is in the
request body:

- The Buildkite OIDC token, validated before the body is read, which establishes
  the calling pipeline's identity.
- The profile's [match rules](/reference/profiles/matching), which decide
  whether that pipeline may use the profile it named.
- The [profile's permissions](/reference/profiles) and the reach of the GitHub
  App installation, which bound what the issued token can do.

A target therefore narrows the answer to something the caller is already
entitled to, or produces no credentials at all. It cannot widen one. A
caller-scoped organization profile is the only case where the target selects a
repository, and it selects within authority the profile already grants.

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
serve -> err: "profile, scope or upstream failure"
```

| Stage                                                             | Answers with                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------------- |
| Routing                                                           | 404 when the method and path do not match a route              |
| Authentication                                                    | 401 when the OIDC token is missing or invalid                  |
| [Property parsing](#property-parsing)                             | 413 when the body exceeds 20 KB, 500 on any other read failure |
| [`protocol` and `host` required](#protocol-and-host-are-required) | 200 with no credentials, or 400                                |
| [GitHub over HTTPS only](#only-github-over-https-is-supported)    | 200 with no credentials                                        |
| Profile resolution                                                | 400, 404 or 500                                                |
| Profile match rules                                               | 403 when the caller may not use the profile                    |
| [Repository matching](#repository-matching)                       | 200 with credentials, or 200 with no credentials               |
| Token issuance                                                    | 403 when GitHub refuses, 500 on other upstream failures        |

Authentication runs before the body is touched. The 20 KB body limit is
installed ahead of authentication, but only takes effect when the handler reads
the body, so an oversized request without a valid token returns 401 rather than 413.

Both checks on the requested target are settled before any profile lookup,
cache access, Buildkite repository lookup or GitHub token mint. A
request answered at either stage cannot be affected by the profile it names, by
the cache, or by the state of either upstream service.

## Property parsing

The request body follows Git's
[credential helper input format](/reference/git-credentials-format#input-format).
Parsing is deliberately tolerant:

- Each line is split at the first `=`. The remainder of the line is the value.
- The first empty line terminates input. Anything after it is ignored.
- Lines with no `=`, or with an empty key, are discarded.
- A repeated key keeps the last value supplied.
- Properties Chinmina Bridge does not use are ignored.

A malformed line therefore does not fail the request. Only a failure to read
the body does: an oversized body returns 413, and any other read failure
returns 500. Both carry the `Chinmina-Denied` header.

## `protocol` and `host` are required

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
- An unsupported value does not excuse a missing counterpart. A request with an
  unsupported protocol and no host returns 400, because the target is
  incomplete.
- No whitespace is trimmed. A property valued with a space is a supplied value,
  not an absent one.

## Only GitHub over HTTPS is supported

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
resolved. An unknown profile name, or one the caller may not use, still returns
200 with no credentials when the destination is unsupported: the profile is
never consulted, because no profile could fulfil the request.

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

Each profile kind decides coverage differently.

### Pipeline profiles

The reconstructed request URL must equal the repository URL Buildkite reports
for the authenticated pipeline. An SSH-form repository is translated to HTTPS
before the comparison, which is otherwise exact. A failed Buildkite lookup
returns 500; it is not converted into an empty response.

See [pipeline profiles](/reference/profiles/pipeline).

### Static organization profiles

The repository name from the request must appear in the profile's
`repositories` list. Only the name is compared: a `.git` suffix is removed and
the owner is ignored. The GitHub App installation's reach, not this comparison,
determines which repositories a token can actually be used for.

See [organization profiles](/reference/profiles/organization).

### Caller-scoped organization profiles

The token is scoped to the repository name derived from `path`, so every
derivable repository is covered. A path that derives no name returns 400 with
`repository scope is required for this profile`. Omitted, empty, root and
owner-only paths derive nothing, as do paths whose repository component contains
a further `/`, whitespace or control characters.

See [caller-scoped
repositories](/reference/profiles/organization#caller-scoped-repositories).

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
destination and repository mismatch all produce the same response.

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
  This is a successful outcome, not a failure, and applies equally to an empty
  target, an unsupported destination and a repository mismatch.
- The requested repository is recorded as the URL reconstructed from the
  supplied properties, including for an unsupported destination. An empty
  target has no requested repository, and an incomplete target records none.
- A request answered before profile resolution records the profile name it
  asked for, and no resolved profile, App or token metadata.

[use-http-path]: https://git-scm.com/docs/gitcredentials#Documentation/gitcredentials.txt-credentialuseHttpPath
