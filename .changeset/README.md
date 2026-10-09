# Changesets

Every PR that changes a published package adds a changeset: run `bun changeset`, pick the package and bump, and write the release note. On merge to `main` the publish workflow opens or updates a "chore: update versions" PR, and merging that PR publishes to npm.

The packages are versioned independently. Their first release is `1.0.0`, produced by a `major` changeset on the PR that implements them.
