const UA = 'NpmPackageTracker/0.1 (+contact: npm-tracker-admin@example.com)';
const REGISTRY_URL = 'https://registry.npmjs.org';

export async function fetchVersions({ packageName, startDate, maxResults }) {
    const res = await fetch(`${REGISTRY_URL}/${encodeURIComponent(packageName)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    if (res.status === 404) throw new Error(`Package not found: ${packageName}`);
    if (!res.ok) throw new Error(`npm registry request failed for ${packageName}: ${res.status}`);

    const data = await res.json();

    const latestTag = data['dist-tags']?.latest ?? null;
    const packageDeprecationMessage = typeof data.deprecated === 'string' ? data.deprecated : null;

    const timeEntries = Object.entries(data.time ?? {}).filter(([key]) => key !== 'created' && key !== 'modified');

    return timeEntries
        .filter(([, dateStr]) => new Date(dateStr) >= startDate)
        .sort((a, b) => new Date(b[1]) - new Date(a[1]))
        .slice(0, maxResults)
        .map(([version, dateStr]) => {
            const versionInfo = data.versions?.[version];
            return {
                packageName: data.name,
                version,
                publishedAt: dateStr,
                isLatest: version === latestTag,
                versionDeprecationMessage: typeof versionInfo?.deprecated === 'string' ? versionInfo.deprecated : null,
                packageDeprecationMessage,
                tarballUrl: versionInfo?.dist?.tarball ?? null,
            };
        });
}
