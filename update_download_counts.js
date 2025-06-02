const fetch = require("node-fetch");
const fs = require("fs/promises");

async function getTotalDownloads(repoUrl) {
  const [owner, repo] = repoUrl.replace("https://github.com/", "").split("/");
  const releasesUrl = `https://api.github.com/repos/${owner}/${repo}/releases`;

  const response = await fetch(releasesUrl);
  if (!response.ok)
    throw new Error(`Failed to fetch releases from ${releasesUrl}`);
  const releases = await response.json();

  if (!Array.isArray(releases) || releases.length === 0) {
    return 0;
  }

  return releases.reduce((sum, release) => {
    return (
      sum +
      release.assets.reduce((aSum, asset) => aSum + asset.download_count, 0)
    );
  }, 0);
}

async function updateDownloadCounts(manifestPath) {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const updatedPlugins = [];

  for (const plugin of manifest) {
    const previousCount = plugin.DownloadCount;
    const totalDownloads = await getTotalDownloads(plugin.RepoUrl);

    const versionUnchanged =
      plugin.AssemblyVersion && typeof plugin.AssemblyVersion === "string";

    if (versionUnchanged && totalDownloads !== previousCount) {
      plugin.DownloadCount = totalDownloads;
      plugin.LastUpdated = Date.now();
      updatedPlugins.push(plugin.Name);
    }
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 4), "utf8");
  console.log(`Manifest updated: ${manifestPath}`);

  if (updatedPlugins.length > 0) {
    const commitMessage = `Updated download counts: ${updatedPlugins.join(
      ", "
    )}`;
    console.log(`Suggested commit message:\n${commitMessage}`);
  } else {
    console.log(
      "No download count changes detected; no commit message necessary."
    );
  }
}

updateDownloadCounts("manifest.json");
