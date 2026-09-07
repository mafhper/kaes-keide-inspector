# Release Workflow Guide

This document describes how Kaes Keid Inspector publishes extension versions,
builds the package and assembles the GitHub Release body.

## Overview

The repository has three independent flows:

| Event | What happens | Workflow |
| --- | --- | --- |
| Push to `main` | Validation and build of the app | `.github/workflows/ci.yml` |
| Push to `main` | Publication of the demo site | `.github/workflows/deploy.yml` |
| Push of `vX.Y.Z` | Build, packaging and GitHub Release | `.github/workflows/release.yml` |

A Release is **not** created by a regular push to `main`. It is born from a
version tag:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Versioning

The version must be synchronized between two sources:

- `version` in `package.json`
- `version` in `manifest.json`

The workflow compares both with the tag core version (`vX.Y.Z`, ignoring any
pre-release suffix) before running the build. If either one differs, the Release
fails before publication.

Tags follow Semantic Versioning and may include pre-release or build suffixes:

```text
v1.0.0
v1.0.0-rc.1
v1.0.0+20260907
```

## Published file

The build script already produces `kaes-keid-inspector.zip` containing the
compiled content of `dist/`. During a Release, the workflow validates the ZIP and
renames it to:

```text
kaes-keide-inspector-vX.Y.Z.zip
```

That file is attached directly to the GitHub Release. End users do not need to
install Node.js, Bun or run the build process.

## Release body

The workflow assembles the Release body in five main parts:

1. **Product image** - `docs/images/releases/release.webp`, resolved per the
   image policy (see `docs/release-image-policy.md`).
2. **One-line description** of the extension.
3. **What's new in this version** - manual content from `.github/release-notes/vX.Y.Z.md`.
4. **Installation** - instructions to load the compiled ZIP in Chrome or Edge.
5. **List of changes** - technical changelog generated automatically by GitHub,
   collapsed inside a `<details>` block.

### Image

The single working file is:

```text
docs/images/releases/release.webp
```

The image represents a `major.minor` line, not an individual release. Replace it
only when starting a new `major.minor` line; the workflow fails the release if
that line changes but the image was not updated. See
`docs/release-image-policy.md` for the full policy.

The image URL points to the tag of the Release itself, so historical Releases
never change their artwork.

### Manual notes

Create:

```text
.github/release-notes/vX.Y.Z.md
```

Use a short list of changes that matter to users. Do not include `##` headings,
because the workflow already creates the section.

If the file does not exist, the Release is still published with a message saying
there are no specific notes.

### Automatic changelog

The workflow uses the GitHub release-notes generation API together with the
configuration in `.github/release.yml` to categorize changes as:

- **Features and improvements** - `enhancement` and `feature` labels
- **Bug fixes** - `bug` and `fix` labels
- **Other changes** - remaining labels

Pull requests tagged with `dependencies` or `ignore-for-release`, as well as
`dependabot` authors, are excluded from the changelog.

## Recommended process

1. Update the version in `package.json` and `manifest.json`.
2. Add `.github/release-notes/vX.Y.Z.md`.
3. If this starts a new `major.minor` line, replace
   `docs/images/releases/release.webp`.
4. Run locally:

```bash
npm ci
npm run lint
npm test
npm run build
```

5. Push the changes to `main` and wait for CI.
6. Create and push the tag:

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

7. The workflow runs lint, tests, build, validates the ZIP, creates the Release
   and attaches the final archive.

## Manual run

`Release Extension` can also be triggered with `workflow_dispatch`, providing an
existing tag. This is useful to re-publish an already-created Git tag without
creating a new one. The workflow is not idempotent: it fails if the Release
already exists.

## Rules

- Release tags must follow `vX.Y.Z` (pre-release suffixes allowed).
- `package.json`, `manifest.json` and the tag core version must match.
- The final ZIP is produced in CI; it must not be committed to the repository.
- A new `major.minor` line requires an updated `release.webp`.
- The automatic changelog stays collapsed so the Release stays readable.
- User-facing release text should avoid emojis.