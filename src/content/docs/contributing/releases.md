---
title: Release process
description: How releases of Chinmina are considered ready, and how they're created.
---

```d2 sketch=true title="Release pipeline"
grid-rows: 2
grid-gap: 60

merge: "1. Merge"
draft-release: "2. Draft release"
tag: "3. Tag"
release-creation: "4. Release creation"
signing: "5. Signing"
release-ready: "6. Release ready"

merge -> draft-release -> tag -> release-creation -> signing -> release-ready
```

1. **Merge**: a maintainer merges the automated Release Please pull request.
2. **Draft release**: Release Please opens a draft GitHub release for the version.
3. **Tag**: Release Please pushes the version tag.
4. **Release creation**: the tag push triggers GoReleaser to build the release artifacts.
5. **Signing**: GoReleaser signs and attests the artifacts with cosign.
6. **Release ready**: the pipeline publishes the release once it is signed and attested.

:::note

Maintainers cannot create or update version tags (`vX.Y.Z`). If the version
number needs correction, the standard Release Please mechanisms are available.

:::

## Creating a release

A maintainer creates a release by merging the current Release PR.

A release is ready to create when:

- `main` is stable and fully tested, and
- there are changes waiting to go out.

Prefer multiple, smaller releases over releases that have a greater number of
changes.

## Release signing

The [Sigstore][sigstore] ecosystem is leveraged for signing executable release outputs. ([Docs][sigstore-docs].)

- [`cosign`][cosign] is used as the signing CLI tool
- The [`fulcio`][fulcio] public-good instance is used for ephemeral signing certificates
- The [`rekor`][rekor] [public-good instance][rekor-search] is used for Certificate Transparency record publishing.

The signing process allows some useful attributes of the binaries to be verified:

- the provider of the identity for the build process (i.e. GitHub Actions)
- the build process that was used to generate them (both scripts and compute)
- the Git reference of the code that was used to build the binary

Releases are signed with `cosign`, with transparency records published to the [public-good Rekor instance].

[sigstore]: https://www.sigstore.dev/
[sigstore-docs]: https://docs.sigstore.dev/
[cosign]: https://github.com/sigstore/cosign?tab=readme-ov-file
[fulcio]: https://github.com/sigstore/fulcio?tab=readme-ov-file
[rekor]: https://github.com/sigstore/rekor?tab=readme-ov-file
[rekor-search]: https://search.sigstore.dev/

## Testing the release process

It is possible to run GoReleaser locally to test some of the release processes.
(`goreleaser` must be available.)

```shell
# from the root of the local working copy
goreleaser release --clean --verbose --skip "announce,validate"
```

This will run the binary and image builds, and publish a temporary image to
[`ttl.sh`](https://ttl.sh/). Temporary images can be used in local testing with
`docker compose`.

Some processes are skipped when doing this:

- binary signing
- image signing
- changelog generation
- GitHub release creation

Thus release testing verifies a proportion of the GoReleaser configuration, and allows the image/binary builds to be integration tested.
