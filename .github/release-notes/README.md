# Per-release release notes

Create a file for each version using the exact tag as the name:

```text
.github/release-notes/v1.0.1.md
```

The content is inserted into the **What's new in this version** section of the
Release. Use simple markdown and describe only changes that matter to someone who
uses the extension.

Example:

```markdown
- **New detector.** Added support for identifying technology X.
- **Improved inspector.** CSS property reading now covers Y.
- **Fix.** Resolved an issue that affected Z.
```

Do not include `#` or `##` headings in the file; the workflow creates the section
heading for you.

The release image policy is defined in `docs/release-image-policy.md`. The single
working file is:

```text
docs/images/releases/release.webp
```

Replace it when you start a new `major.minor` line. Patch releases reuse the image.