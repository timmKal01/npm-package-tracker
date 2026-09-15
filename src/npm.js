const UA = 'NpmPackageTracker/0.1 (+contact: npm-tracker-admin@example.com)';
const REGISTRY_URL = 'https://registry.npmjs.org';

const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 15_000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let res;
        try {
            res = await fetch(url, { ...options, signal: controller.signal });
        } catch (err) {
            lastError = err.name === 'AbortError' ? new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${url}`) : err;
            if (attempt < MAX_ATTEMPTS) {
                await sleep(1000 * 2 ** (attempt - 1));
                continue;
            }
            throw lastError;
        } finally {
            clearTimeout(timeoutId);
        }
        if (res.status === 404 || res.ok) return res;
        if (!TRANSIENT_STATUSES.has(res.status)) {
            throw new Error(`npm registry request failed: ${res.status} ${res.statusText}`);
        }
        lastError = new Error(`npm registry request failed: ${res.status} ${res.statusText}`);
        if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1));
    }
    throw lastError;
}

export async function fetchVersions({ packageName, startDate, maxResults }) {
    const res = await fetchWithRetry(`${REGISTRY_URL}/${encodeURIComponent(packageName)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    if (res.status === 404) throw new Error(`Package not found: ${packageName}`);

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
