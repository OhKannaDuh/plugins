import { GitHubClient } from "./GitHubClient";
import { CombinedPluginManifest } from "../../shared-types/src/PluginTypes";

const CURRENT_API_VERSION = 13;

export interface SourcePlugin {
  repo: string;
  manifest: string;
}
export class PluginEntry {
  constructor(
    private source: SourcePlugin,
    private existing: CombinedPluginManifest | undefined
  ) {}

  public async enrich(): Promise<CombinedPluginManifest | null> {
    try {
      const manifestRes = await fetch(this.source.manifest);
      if (!manifestRes.ok) {
        console.error(`Failed to fetch manifest: ${this.source.manifest}`);
        return null;
      }

      const manifest = (await manifestRes.json()) as CombinedPluginManifest;
      const client = new GitHubClient(this.source.repo);

      const { version, totalDownloads } =
        await client.getLatestVersionAndTotalDownloads();
      const downloadLink = `${this.source.repo}/releases/latest/download/latest.zip`;

      const versionChanged =
        !this.existing || this.existing.AssemblyVersion !== version;

      const enriched: CombinedPluginManifest = {} as CombinedPluginManifest;
      enriched.Author = manifest.Author || "Unknown";
      enriched.Name =
        manifest.Name || this.source.repo.split("/").pop() || "Unknown Plugin";
      enriched.InternalName =
        manifest.InternalName || enriched.Name.replaceAll(" ", "");
      enriched.Punchline = manifest.Punchline || "";
      enriched.Description = manifest.Description || "";
      enriched.IconUrl = manifest.IconUrl || "";
      enriched.ApplicableVersion = manifest.ApplicableVersion || "any";
      enriched.RepoUrl = this.source.repo;
      enriched.Tags = manifest.Tags || [];
      enriched.DalamudApiLevel =
        manifest.DalamudApiLevel || CURRENT_API_VERSION;
      enriched.AssemblyVersion = version;
      enriched.DownloadLinkInstall = downloadLink;
      enriched.DownloadLinkUpdate = downloadLink;

      const preRelease = await client.getLatestPreReleaseDownload();
      if (preRelease) {
        const versionMatch = preRelease.tag.match(/^(\d+\.\d+\.\d+)/);
        const apiMatch = preRelease.tag.match(/api(\d+)/i);

        enriched.TestingDalamudApiLevel = apiMatch
          ? Number(apiMatch[1])
          : CURRENT_API_VERSION;
        enriched.TestingAssemblyVersion = versionMatch ? versionMatch[1] : "";
        enriched.DownloadLinkTesting = preRelease.downloadUrl;
      }

      enriched.DownloadCount = versionChanged
        ? totalDownloads
        : this.existing?.DownloadCount ?? totalDownloads;
      enriched.LastUpdated = versionChanged
        ? Date.now()
        : this.existing?.LastUpdated ?? Date.now();

      if (preRelease) {
        enriched.TestingLastUpdated = preRelease.publishedAt;
      }

      return enriched;
    } catch (err) {
      console.error(`Error enriching plugin: ${this.source.repo}`, err);
      return null;
    }
  }
}
