const fetch = require("node-fetch");
const fs = require("fs/promises");
const path = require("path");

async function getLatestReleaseVersionAndDownloadCount(repoUrl) {
    const [owner, repo] = repoUrl.replace("https://github.com/", "").split("/");
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Failed to fetch release from ${apiUrl}`);
    const data = await response.json();

    const version = data.tag_name || "0.0.1";
    const totalDownloads = data.assets.reduce((sum, asset) => sum + asset.download_count, 0);

    return { version, totalDownloads };
}

async function buildCombinedManifest(sourceFilePath, outputFilePath) {
    const sourceData = JSON.parse(await fs.readFile(sourceFilePath, "utf8"));
    const combined = [];

    for (const entry of sourceData) {
        const manifestResp = await fetch(entry.manifest);
        if (!manifestResp.ok) {
            console.error(`Failed to fetch manifest: ${entry.manifest}`);
            continue;
        }

        const manifest = await manifestResp.json();
        const repoUrl = entry.repo;
        const { version: latestVersion, totalDownloads } = await getLatestReleaseVersionAndDownloadCount(repoUrl);
        const downloadLink = `${repoUrl}/releases/latest/download/latest.zip`;

        const enriched = {
            ...manifest,
            InternalName: manifest.Name,
            RepoUrl: repoUrl,
            DownloadLinkInstall: downloadLink,
            DownloadLinkUpdate: downloadLink,
            AssemblyVersion: latestVersion,
            DownloadCount: totalDownloads,
            LastUpdated: Date.now(),
        };

        combined.push(enriched);
    }

    await fs.writeFile(outputFilePath, JSON.stringify(combined, null, 4), "utf8");
    console.log(`Manifest written to ${outputFilePath}`);
}

buildCombinedManifest("plugins.json", "manifest.json");
