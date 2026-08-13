import { Actor, log } from 'apify';
import { fetchVersions } from './npm.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { packages = [], daysBack = 30, maxResultsPerPackage = 10 } = input;

if (packages.length === 0) {
    throw new Error('No packages provided.');
}

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const PACKAGE_CHECKED_EVENT = 'package-checked';

const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

for (const packageName of packages) {
    let versions;
    try {
        versions = await fetchVersions({
            packageName: packageName.trim(),
            startDate,
            maxResults: Math.min(maxResultsPerPackage, 50),
        });
    } catch (err) {
        log.warning(`Failed to fetch versions`, { packageName, error: err.message });
        continue;
    }

    if (versions.length > 0) {
        await Actor.pushData(versions);
    }
    await Actor.charge({ eventName: PACKAGE_CHECKED_EVENT });

    log.info(`Checked package`, { packageName, versionsFound: versions.length });
}

await Actor.exit();
