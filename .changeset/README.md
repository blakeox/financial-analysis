# Changesets

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version bumps and changelogs. Packages are **not** published to npm; the release workflow opens a **Version Packages** PR on `main` when changesets are present.

## When to add a changeset

Add a changeset when your PR changes a published workspace package (`packages/analysis`, `packages/ui`, etc.) in a way that should be noted in the changelog:

```bash
pnpm changeset
```

Follow the prompts (patch / minor / major and a short summary).

## Release flow

1. Merge PRs with changeset files under `.changeset/`.
2. On `main`, [release.yml](../.github/workflows/release.yml) opens or updates the Version Packages PR.
3. Merge that PR to apply version bumps and `CHANGELOG.md` updates.

Do not commit changesets for docs-only or CI-only changes unless a package version should bump.
