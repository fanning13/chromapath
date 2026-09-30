import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
test("skill and browser share identical algorithm", async () =>
  assert.equal(
    await readFile(new URL("../public/core.js", import.meta.url), "utf8"),
    await readFile(
      new URL("../skills/map-palette/scripts/core.mjs", import.meta.url),
      "utf8",
    ),
  ));
test("portable CLI exports sample and protects an existing output", async () => {
  const dir = await mkdtemp(join(tmpdir(), "chromapath-test-")),
    out = join(dir, "sample.geojson");
  try {
    const args = [
      "skills/map-palette/scripts/color-map.mjs",
      "--sample",
      out,
      "sorbet",
    ];
    const report = JSON.parse(
      execFileSync(process.execPath, args, { encoding: "utf8" }),
    );
    assert.equal(report.regions, 19);
    const data = JSON.parse(await readFile(out, "utf8"));
    assert.match(data.features[0].properties.fill, /^#[a-f\d]{6}$/i);
    assert.throws(() =>
      execFileSync(process.execPath, args, { stdio: "pipe" }),
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
