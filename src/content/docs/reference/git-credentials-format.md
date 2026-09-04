---
title: Git credentials format
description: Reference documentation for Git's credential helper protocol format.
---

Credential helpers are a core part of Git's credential management system, implementing an extensible credential system for Git.

For details on the Credential Helper system, see Git's [Custom helpers][git-custom-helpers] documentation, detailing how helpers are written and invoked.

## Git credential helper protocol

Git's credential helper protocol uses a simple text-based format for both input and output. Credential helpers receive requests on stdin and return credentials on stdout. This is [specified fully in Git's documentation][git-iofmt], but the following will serve as a primer.

### Input format

Git sends credential requests in this format:

```text
protocol=https
host=github.com
path=owner/repository
```

Each line contains a key-value pair separated by `=`. The protocol and host fields are always present, while the path may be included depending on the Git operation and URL format.

### Output format

Credential helpers respond with:

```text
username=x-access-token
password=ghs_...
```

For GitHub token authentication, the username is conventionally set to `x-access-token` (though GitHub accepts any value), and the password contains the actual installation token.

#### Optional fields

The output format supports optional fields:

##### `password_expiry_utc`

Unix timestamp indicating when the password expires:

```text
protocol=https
host=github.com
path=owner/repository
username=x-access-token
password=ghs_...
password_expiry_utc=1705320600
```

This field is provided by Chinmina Bridge when vending tokens so that Git can use this information to proactively refresh credentials before they expire.

### Empty response

An empty response (no key-value pairs) signals to Git that the credential helper cannot provide credentials for the requested URL. This causes Git to try other configured helpers or prompt the user (if there are no more helpers to try).

Empty responses are used when:

- The requested repository does not match a repository that can be supported by this helper
- The credential helper does not handle the specific host or protocol
- No valid credentials are available for the request

This behaviour allows multiple credential helpers to coexist, with each handling different URL patterns.

## Development properties

When [`DEV_DISCLOSE_APP_IDENTIFIERS`](/reference/configuration#dev_disclose_app_identifiers)
is `true`, Chinmina Bridge adds three properties to its credential output:

| Property                   | Description                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| `chinmina_app_name`        | Name of the GitHub App the token was created through. `default` when the default app is used. |
| `chinmina_app_id`          | Numeric application ID of that GitHub App.                                                   |
| `chinmina_installation_id` | Numeric installation ID the token was issued for.                                            |

Git discards attributes it does not recognise, so credential helpers that
receive these properties are unaffected by them. The `chinmina_` prefix keeps
them clear of the attributes Git does know: a supplied attribute overwrites the
value Git holds for `protocol`, `host`, `path`, `username` or `password`.

The setting is for development only. Chinmina Bridge logs a warning at startup
while it is enabled.

[git-custom-helpers]: https://git-scm.com/docs/gitcredentials#_custom_helpers
[git-iofmt]: https://git-scm.com/docs/git-credential#IOFMT
