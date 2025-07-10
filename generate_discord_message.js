const fs = require("fs");

const manifest = require("./manifest.json");

function formatTimestamp(ms) {
  const date = new Date(Number(ms));
  return date.toUTCString();
}

console.log('Repo: https://raw.githubusercontent.com/OhKannaDuh/plugins/refs/heads/master/manifest.json');
console.log();

for (const plugin of manifest) {
  const {
    Name,
    Punchline,
    Description,
    AssemblyVersion,
    RepoUrl,
    LastUpdated,
  } = plugin;

  const message = [
    `**📦 ${Name}** — *${Punchline}*`,
    ``,
    `${Description}`,
    ``,
    `🔗 **Source:** ${RepoUrl}`,
    `🏷️ **Latest Version: ${AssemblyVersion}`,
    `🕒 **Last Updated:** ${formatTimestamp(LastUpdated)}`,
    ``,
  ].join("\n");

  console.log(message);
}
