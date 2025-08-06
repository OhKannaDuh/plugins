import { PluginEntry, SourcePlugin } from "./PluginEntry";
import { CombinedPluginManifest } from "../../shared-types/src/PluginTypes";
import fs from "fs/promises";

export class ManifestBuilder {
  constructor(private sourcePath: string, private outputPath: string) {}

  public async build(): Promise<void> {
    const sourceRaw = await fs.readFile(this.sourcePath, "utf8");
    const sourceData: SourcePlugin[] = JSON.parse(sourceRaw);

    let existing: CombinedPluginManifest[] = [];
    try {
      const existingRaw = await fs.readFile(this.outputPath, "utf8");
      existing = JSON.parse(existingRaw);
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err;
    }

    const combined: CombinedPluginManifest[] = [];
    const updated: string[] = [];

    for (const entry of sourceData) {
      const existingEntry = existing.find((e) => e.RepoUrl === entry.repo);
      const plugin = new PluginEntry(entry, existingEntry);
      const enriched = await plugin.enrich();

      if (!enriched) continue;

      if (
        !existingEntry ||
        existingEntry.AssemblyVersion !== enriched.AssemblyVersion
      ) {
        updated.push(`${enriched.Name} ${enriched.AssemblyVersion}`);
      }

      if (
        enriched.TestingAssemblyVersion &&
        (!existingEntry ||
          existingEntry.TestingAssemblyVersion !==
            enriched.TestingAssemblyVersion)
      ) {
        updated.push(
          `${enriched.Name} ${enriched.TestingAssemblyVersion} (testing)`
        );
      }

      combined.push(enriched);
    }

    await fs.writeFile(
      this.outputPath,
      JSON.stringify(combined, null, 4),
      "utf8"
    );
    console.log(`Manifest written to ${this.outputPath}`);

    if (updated.length > 0) {
      console.log("Suggested commit message:");
      console.log(updated.join(", "));
    } else {
      console.log("No plugins updated; no commit message necessary.");
    }
  }
}
