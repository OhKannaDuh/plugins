import fetch from "node-fetch";

export interface ReleaseAsset {
  name: string;
  download_count: number;
  browser_download_url: string;
}

export interface Release {
  tag_name: string;
  prerelease: boolean;
  draft: boolean;
  assets: ReleaseAsset[];
  published_at: string;
}

export class GitHubClient {
  constructor(private repoUrl: string) {}

  private get [Symbol.toStringTag]() {
    return "GitHubClient";
  }

  private getApiBase(): string {
    const [owner, repo] = this.repoUrl.replace("https://github.com/", "").split("/");
    return `https://api.github.com/repos/${owner}/${repo}`;
  }

  public async fetchAllReleases(): Promise<Release[]> {
    const releases: Release[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const url = `${this.getApiBase()}/releases?per_page=${perPage}&page=${page}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(`Failed to fetch releases from ${url}`);

      const data = (await res.json()) as Release[];
      releases.push(...data);

      if (data.length < perPage) break;

      page++;
    }

    return releases;
  }

  public async getLatestVersionAndTotalDownloads(): Promise<{ version: string; totalDownloads: number }> {
    const releases = await this.fetchAllReleases();

    if (releases.length === 0) return { version: "0.0.1", totalDownloads: 0 };

    const latest = releases.find((r) => !r.prerelease) || releases[0];
    const version = latest.tag_name || "0.0.1";

    const totalDownloads = releases.reduce(
      (sum, release) => sum + release.assets.reduce((a, asset) => a + asset.download_count, 0),
      0
    );

    return { version, totalDownloads };
  }

public async getLatestPreReleaseDownload(): Promise<{ downloadUrl: string; tag: string } | null> {
  const url = `${this.getApiBase()}/releases`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const releases: Release[] = await res.json() as Release[];

  const prereleases = releases
    .filter(r => r.prerelease && !r.draft)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  for (const release of prereleases) {
    const asset = release.assets.find(a => a.name.toLowerCase() === "latest.zip");
    if (asset) {
      return {
        downloadUrl: asset.browser_download_url,
        tag: release.tag_name,
      };
    }
  }

  return null;
}
}
