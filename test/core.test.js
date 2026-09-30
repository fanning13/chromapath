import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sample,
  adjacency,
  colorGraph,
  validate,
  contrast,
  textColor,
} from "../public/core.js";
test("sample topology has 42 edges and no neighboring color collisions", () => {
  const g = adjacency(sample()),
    c = colorGraph(g);
  assert.equal(g.reduce((s, n) => s + n.size, 0) / 2, 42);
  g.forEach((n, i) => n.forEach((j) => assert.notEqual(c[i], c[j])));
});
test("DSATUR handles clique, disconnected graph and isolated node", () => {
  const g = Array.from(
    { length: 5 },
    (_, i) =>
      new Set(Array.from({ length: 5 }, (_, j) => j).filter((j) => i !== j)),
  );
  assert.equal(new Set(colorGraph(g)).size, 5);
  assert.deepEqual(colorGraph([new Set(), new Set()]), [0, 0]);
});
test("separated regions are not neighbors", () => {
  const d = sample();
  d.features = [d.features[0], d.features.at(-1)];
  assert.equal(adjacency(d)[0].size, 0);
});
test("rejects malformed rings and non-finite coordinates", () => {
  let d = sample();
  d.features[0].geometry.coordinates[0][0][0] = NaN;
  assert.throws(() => validate(d));
  d = sample();
  d.features[0].geometry.coordinates[0].pop();
  assert.throws(() => validate(d));
});
test("contrast reference endpoints and readable text", () => {
  assert.equal(contrast("#ffffff", "#000000"), 21);
  assert.equal(textColor("#ffffff"), "#000000");
});
