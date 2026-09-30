#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { palettes, validate, adjacency, colorGraph, sample } from "./core.mjs";
const [input, output, mood = "sorbet"] = process.argv.slice(2);
if (!input || !output) {
  console.error(
    "Usage: node color-map.mjs <input.geojson|--sample> <output.geojson> [sorbet|forest|ocean]",
  );
  process.exit(1);
}
try {
  if (!Object.hasOwn(palettes, mood))
    throw Error("Choose sorbet, forest, or ocean.");
  const raw = input === "--sample" ? null : await readFile(input, "utf8");
  if (raw && Buffer.byteLength(raw) > 2000000)
    throw Error("Input exceeds 2 MB.");
  const data = raw ? validate(JSON.parse(raw)) : sample(),
    graph = adjacency(data),
    colors = colorGraph(graph),
    palette = palettes[mood];
  if (Math.max(...colors) >= palette.length)
    throw Error("Palette has too few colors for this graph.");
  data.features.forEach((f, i) => {
    f.properties = {
      ...f.properties,
      fill: palette[colors[i]],
      "fill-opacity": 1,
      stroke: "#fffdf7",
    };
  });
  // Exclusive creation protects an existing file from accidental replacement.
  await writeFile(output, JSON.stringify(data, null, 2), { flag: "wx" });
  console.log(
    JSON.stringify({
      regions: data.features.length,
      borders: graph.reduce((s, n) => s + n.size, 0) / 2,
      colors: Math.max(...colors) + 1,
      palette: mood,
      output,
    }),
  );
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
