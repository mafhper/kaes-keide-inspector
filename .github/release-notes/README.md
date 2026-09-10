# Per-release release notes

Create a file for each version using the exact tag as the name:

```text
.github/release-notes/v1.0.1.md
```

The file **must start with** `## What's new in this version` as its first line.
The Release Core inserts this content verbatim after the title and tagline.

Example:

```markdown
## What's new in this version

- **New detector.** Added support for identifying technology X.
- **Improved inspector.** CSS property reading now covers Y.
- **Fix.** Resolved an issue that affected Z.
```

Use simple markdown and describe only changes that matter to someone who uses the
extension.

The release image policy is defined in `docs/release-image-policy.md`. The single
working file is:

```text
docs/images/releases/release.webp
```

Replace it when you start a new `major.minor` line. Patch releases reuse the image.