const fs = require("fs");

const manifest = require("./manifest.json");

function formatTimestamp(ms) {
  const date = new Date(Number(ms));
  return date.toUTCString();
}

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
    `🔗 **Repo:** ${RepoUrl}`,
    `🏷️ **Latest Version: ${AssemblyVersion}`,
    `🕒 **Last Updated:** ${formatTimestamp(LastUpdated)}`,
    `\n---\n`,
  ].join("\n");

  console.log(message);
}
