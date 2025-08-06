import { ManifestBuilder } from "./ManifestBuilder";

(async () => {
  const builder = new ManifestBuilder("../plugins.json", "../manifest.json");
  await builder.build();
})();
