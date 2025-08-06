import { readFileSync } from "fs";
import { CombinedPluginManifest } from "../../shared-types/src/PluginTypes";
import { DiscordMessageBuilder } from "./DiscordMessageBuilder";

const manifest: CombinedPluginManifest[] = JSON.parse(readFileSync("../manifest.json", "utf-8"));

console.log("To use my plugins at this repository to your 'Custom Plugin Repositories' in Dalamud settings under Experimental:");
console.log('Repo: https://raw.githubusercontent.com/OhKannaDuh/plugins/refs/heads/master/manifest.json');
console.log();

const builder = new DiscordMessageBuilder(manifest);
const messages = builder.buildMessages();

for (const message of messages) {
  console.log(message);
  console.log();
}
