import { CombinedPluginManifest } from "../../shared-types/src/PluginTypes";

export class DiscordMessageBuilder {
  constructor(private readonly manifest: CombinedPluginManifest[]) {}

  private formatTimestamp(ms: number): string {
    const unixSeconds = Math.floor(ms / 1000);
    return `<t:${unixSeconds}:f> (<t:${unixSeconds}:R>)`;
  }

  public buildMessages(): string[] {
    return this.manifest.map((plugin) => this.buildMessage(plugin));
  }

  private buildMessage(plugin: CombinedPluginManifest): string {
    const lines = [`# **${plugin.Name}**`, `    *${plugin.Punchline}*`];

    if (plugin.Description != plugin.Punchline) {
      lines.push(``, `${plugin.Description}`);
    }

    lines.push(
      ``,
      `**Source:** ${plugin.RepoUrl}`,
      `**Latest Version:** ${plugin.AssemblyVersion}`,
      `**Latest API Version:** ${plugin.DalamudApiLevel}`
    );

    if (
      plugin.TestingAssemblyVersion &&
      plugin.TestingDalamudApiLevel &&
      plugin.DownloadLinkTesting
    ) {
      lines.push(`⚠️ **Testing Version:** ${plugin.TestingAssemblyVersion}`);
      lines.push(
        `⚠️ **Testing API Version:** ${plugin.TestingDalamudApiLevel}`
      );
    }

    lines.push(
      ``,
      `**Downloads:** ${plugin.DownloadCount.toLocaleString()}`,
      `**Last Updated:** ${this.formatTimestamp(plugin.LastUpdated)}`
    );

    if (plugin.TestingLastUpdated) {
      lines.push(
        `⚠️ **Testing Last Updated:** ${this.formatTimestamp(
          plugin.TestingLastUpdated
        )}`
      );
    }

    return lines.join("\n");
  }
}
