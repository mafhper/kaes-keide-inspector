# Release Image Policy

This document defines the policy for using the illustrative image in the GitHub
Releases of Kaes Keid Inspector, and how the release workflow automates it.

The core editorial rule: the image represents a **`major.minor` version line**,
not an individual Release.

## 1. Versioning policy

The image must change when `major` or `minor` changes, but not for a new `patch`
release:

| Transition | New image? |
| --- | --- |
| `v1.2.0 -> v1.2.1` | No |
| `v1.2.1 -> v1.2.2` | No |
| `v1.2.9 -> v1.3.0` | Yes |
| `v1.3.0 -> v1.3.1` | No |
| `v1.9.x -> v2.0.0` | Yes |

Therefore:

```text
release image = visual identity of the major.minor line
```

## 2. Image file

The project uses a single working file:

```text
docs/
└── images/
    └── releases/
        └── release.webp
```

The name stays simply `release.webp`. There is no need to keep files such as:

```text
release-1.3.webp
release-v1.3.webp
release-2.0.webp
```

The historical version of the image is preserved by Git, because each Release
references the file through its own tag.

## 3. Why not use `main` in the URL

The image used in the Release notes must not point to `main`:

```text
/main/docs/images/releases/release.webp
```

If `release.webp` is replaced later, a `main`-based URL would make an old Release
show the new artwork.

The URL must use the Release tag:

```text
/<tag>/docs/images/releases/release.webp
```

For example:

```text
/v1.3.0/docs/images/releases/release.webp
```

As a result, the history stays stable:

```text
v1.2.x -> image A
v1.3.x -> image B
v2.0.x -> image C
```

even though the working file in the development branch remains only:

```text
docs/images/releases/release.webp
```

## 4. Automatic detection of an image change

For a new `major.minor` line, the workflow checks whether `release.webp` changed
since the previous version.

The comparison uses the Git history, without trying to visually analyze the WebP:

```bash
git diff <PREVIOUS_TAG>..<CURRENT_TAG> -- docs/images/releases/release.webp
```

If there is a difference, the new image was provided correctly.

If there is no difference, the publication is treated as a possible release
preparation failure.

## 5. Recommended algorithm

The workflow follows this logic:

```text
resolve current version
        |
        v
find previous tag, when it exists
        |
        v
compare major.minor
        |
        |-- same -----------> patch release
        |                          |
        |                          v
        |                    reuse the image
        |
        +-- different ------> new line
                                   |
                                   v
                          release.webp changed?
                              |            |
                             YES           NO
                              |            |
                              v            v
                          publish        fail
```

The image step exports the final URL to the step that assembles the Release body:

```text
release image step
        |
        +-- IMAGE_URL
              |
              v
      release body step
              |
              v
        GitHub Release
```

## 6. Patch releases

For versions such as:

```text
v1.3.1
v1.3.2
v1.3.3
v1.3.4
```

no image change is required.

The workflow uses the `release.webp` present in the tag being published.

## 7. New minor release

Moving from:

```text
v1.3.x -> v1.4.0
```

the editorial process is:

1. replace `docs/images/releases/release.webp`;
2. commit the new image together with the change that will produce the Release;
3. merge into `main`;
4. create the `v1.4.0` tag;
5. let the workflow detect the change;
6. create the Release using the new image.

## 8. New major release

The same principle applies to:

```text
v1.9.x -> v2.0.0
```

A `major` change implies a new line and therefore a new image.

## 9. First Release

If there is no previous tag, there is nothing to compare.

In that case the workflow only requires that:

```text
docs/images/releases/release.webp
```

exists and contains a valid file. This allows introducing the policy without
creating an artificial version just to establish a baseline.

## 10. File validation

Regardless of the Release type, the workflow verifies that the file exists and is
not empty:

```bash
test -f docs/images/releases/release.webp
test -s docs/images/releases/release.webp
```

Optionally, the MIME type or WebP structure can also be validated.

## 11. Integration with the Release notes

The image stays at the top of the Release body, before the textual information:

```html
<p align="center">
  <img
    src="IMAGE_URL"
    width="960"
    alt="Kaes Keid Inspector"
  />
</p>
```

After the image, the sections defined in the release workflow remain:

```text
introduction
    v
What's new in this version
    v
Installation
    v
technical details
    v
automatic changelog
```

The image is an editorial element of the Release presentation and does not need to
be published as a separate asset.

## 12. Benefits

This strategy provides:

- **Automation** - the workflow identifies when a new image should exist.
- **Editorial control** - the choice of artwork remains manual.
- **Stable history** - old Releases keep showing their correct image.
- **Simple repository** - there is only one working file, `release.webp`.
- **Less work** - patch releases need no artwork updates.
- **Protection against forgetting** - a new line can fail automatically if the
  image was not updated.

## 13. Implementation scope

The logic lives inside the existing release workflow (`.github/workflows/release.yml`),
not in a separate image-only workflow.

The first implementation stays simple:

```text
validate version
    v
determine major.minor line
    v
validate release.webp
    v
check change when there is a new line
    v
build URL using the tag
    v
assemble Release body
    v
publish Release
```

The automation handles **detection, validation and versioned reference**, while the
decision about the artwork remains editorial.

## 14. Acceptance criteria

- [ ] `docs/images/releases/release.webp` exists.
- [ ] The workflow verifies the file exists.
- [ ] The image is embedded in the Release notes.
- [ ] The image URL uses the Release tag.
- [ ] A patch release does not require an image change.
- [ ] A `minor` change requires a new image.
- [ ] A `major` change requires a new image.
- [ ] The workflow can detect a `release.webp` change through Git.
- [ ] A new line without an image change fails with a clear message.
- [ ] The first Release is handled specially when no previous tag exists.
- [ ] Old Releases do not depend on the file present in `main`.
- [ ] The WebP is not duplicated as a Release asset.