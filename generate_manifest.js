const fetch = require("node-fetch");
const fs = require("fs/promises");
const path = require("path");

async function getLatestVersionAndTotalDownloads(repoUrl) {
  const [owner, repo] = repoUrl.replace("https://github.com/", "").split("/");
  const releasesUrl = `https://api.github.com/repos/${owner}/${repo}/releases`;

  const response = await fetch(releasesUrl);
  if (!response.ok)
    throw new Error(`Failed to fetch releases from ${releasesUrl}`);
  const releases = await response.json();

  if (!Array.isArray(releases) || releases.length === 0) {
    return { version: "0.0.1", totalDownloads: 0 };
  }

  const latestRelease = releases.find((r) => !r.prerelease) || releases[0];
  const version = latestRelease.tag_name || "0.0.1";

  const totalDownloads = releases.reduce((sum, release) => {
    return (
      sum +
      release.assets.reduce((aSum, asset) => aSum + asset.download_count, 0)
    );
  }, 0);

  return { version, totalDownloads };
}

async function buildCombinedManifest(sourceFilePath, outputFilePath) {
  const sourceData = JSON.parse(await fs.readFile(sourceFilePath, "utf8"));
  let existingManifest = [];

  try {
    existingManifest = JSON.parse(await fs.readFile(outputFilePath, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  const combined = [];

  for (const entry of sourceData) {
    const manifestResp = await fetch(entry.manifest);
    if (!manifestResp.ok) {
      console.error(`Failed to fetch manifest: ${entry.manifest}`);
      continue;
    }

    const manifest = await manifestResp.json();
    const repoUrl = entry.repo;
    const { version: latestVersion, totalDownloads } =
      await getLatestVersionAndTotalDownloads(repoUrl);
    const downloadLink = `${repoUrl}/releases/latest/download/latest.zip`;

    const existingEntry = existingManifest.find((e) => e.RepoUrl === repoUrl);
    const versionChanged =
      !existingEntry || existingEntry.AssemblyVersion !== latestVersion;

    const enriched = {
      ...manifest,
      InternalName: manifest.Name.replaceAll(" ", ""),
      RepoUrl: repoUrl,
      DownloadLinkInstall: downloadLink,
      DownloadLinkUpdate: downloadLink,
      AssemblyVersion: latestVersion,
      DownloadCount: versionChanged
        ? totalDownloads
        : existingEntry?.DownloadCount ?? totalDownloads,
      LastUpdated: versionChanged
        ? Date.now()
        : existingEntry?.LastUpdated ?? Date.now(),
    };

    combined.push(enriched);
  }

  await fs.writeFile(outputFilePath, JSON.stringify(combined, null, 4), "utf8");
  console.log(`Manifest written to ${outputFilePath}`);
}

buildCombinedManifest("plugins.json", "manifest.json");
