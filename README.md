# NPM Package Update Tracker — New Versions & Deprecations

Track new published versions and deprecation warnings for npm packages
you depend on. Get the version, publish date, `latest` dist-tag status,
and deprecation message the moment something changes, without checking
npm by hand.

Built for engineering and security teams monitoring dependencies — a
signal `github-release-tracker` can miss, since not every npm publish
corresponds to a tagged GitHub release.

## Input

```json
{
  "packages": ["react", "@babel/core"],
  "daysBack": 30,
  "maxResultsPerPackage": 10
}
```

| Field | Type | Description |
|---|---|---|
| `packages` | array of strings | npm package names, including scoped packages (e.g. `"@babel/core"`). One lookup is billed per package. |
| `daysBack` | number | Only return versions published within this many days of today. Default `30`, max `365`. |
| `maxResultsPerPackage` | number | Max published versions to return per package, most recent first. Default `10`, max `50`. |

## Output

One record per published version:

```json
{
  "packageName": "react",
  "version": "19.2.8",
  "publishedAt": "2026-07-21T15:41:28.716Z",
  "isLatest": true,
  "versionDeprecationMessage": null,
  "packageDeprecationMessage": null,
  "tarballUrl": "https://registry.npmjs.org/react/-/react-19.2.8.tgz"
}
```

A package with no versions published in the requested window returns no
items but is still billed once for the lookup.

## How it works

Direct calls to the official [npm registry API](https://registry.npmjs.org/)
— the same registry `npm install` talks to. No proxy, no key, no scraping.

## Pricing note

Billed per **package checked**, not per version returned — one charge per
package whether it has 0 or 50 matching versions.

## Related products

- [GitHub Release Tracker](https://github.com/timmKal01/github-release-tracker) — new GitHub releases for repos you depend on, a related but distinct signal from npm publishes
- [NPM Download Stats Tracker](https://github.com/timmKal01/npm-download-stats-tracker) — usage/adoption trend for a package, rather than release activity
