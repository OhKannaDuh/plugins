const fetch = require("node-fetch");
const fs = require("fs/promises");

async function getTotalDownloads(repoUrl) {
  const [owner, repo] = repoUrl.replace("https://github.com/", "").split("/");
  const releasesBaseUrl = `https://api.github.com/repos/${owner}/${repo}/releases`;

  let page = 1;
  const perPage = 100;
  let allReleases = [];
  let hasMore = true;

  while (hasMore) {
    const url = `${releasesBaseUrl}?per_page=${perPage}&page=${page}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch releases from ${url}`);
    }

    const releases = await response.json();
    allReleases = allReleases.concat(releases);

    hasMore = releases.length === perPage;
    page++;
  }

  if (allReleases.length === 0) {
    console.log(`${repo}: No releases found.`);
    return 0;
  }

  let totalDownloads = 0;

  allReleases.forEach((release) => {
    const releaseTag = release.tag_name || "<no-tag>";
    const releaseDownloadCount = release.assets.reduce(
      (sum, asset) => sum + asset.download_count,
      0
    );
    totalDownloads += releaseDownloadCount;
  });

  return totalDownloads;
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
