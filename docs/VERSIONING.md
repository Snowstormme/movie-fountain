# Versioning

Movie Fountain follows [Semantic Versioning 2.0.0](https://semver.org/) for user-visible releases.

- `MAJOR`: incompatible behavior, API, deployment, or configuration changes.
- `MINOR`: backward-compatible features.
- `PATCH`: backward-compatible fixes, documentation, and security updates.

The current baseline is recorded in [`VERSION`](../VERSION). Every release should:

1. Update `VERSION`.
2. Add a dated entry to [`CHANGELOG.md`](../CHANGELOG.md).
3. Explain configuration or migration changes in the README or architecture docs.
4. Verify that secrets, build output, and local environment files are absent from the commit.
5. Tag the commit as `v<version>` after the change is deployed and checked.

Unreleased work stays under the `Unreleased` section of the changelog. Version numbers do not imply TMDB data freshness or provider availability.
