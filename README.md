# GitHub Actions: Release Publish

This GitHub Action used publish a release.

## Inputs

## `apiToken`

Required GitHub API token

## Outputs

## `versionTag`

The release version to use

## Example usage

```yaml
uses: davekpatrick/action-release-publish@0.1.0
with:
  apiToken: ${{ secret.GITHUB_TOKEN }}
```