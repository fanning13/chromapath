export const palettes = {
  sorbet: ["#F4A698", "#F9D776", "#87CBB9", "#A9AFE0", "#E7B6D2"],
  forest: ["#284B42", "#689B79", "#B4C99A", "#E9D8A6", "#C98B68"],
  ocean: ["#145374", "#5588A3", "#8DD3C7", "#D7E8BA", "#F3C969"],
};
export function validate(data) {
  if (
    data?.type !== "FeatureCollection" ||
    !Array.isArray(data.features) ||
    !data.features.length ||
    data.features.length > 250
  )
    throw Error("Use a FeatureCollection containing 1–250 polygons.");
  let points = 0;
  for (const f of data.features) {
    if (f.geometry?.type !== "Polygon")
      throw Error("Only Polygon geometries are supported in this version.");
    if (
      !Array.isArray(f.geometry.coordinates) ||
      !f.geometry.coordinates.length
    )
      throw Error("Polygon needs a ring.");
    for (const ring of f.geometry.coordinates) {
      if (!Array.isArray(ring) || ring.length < 4)
        throw Error("Each ring needs at least four positions.");
      for (const p of ring) {
        if (
          !Array.isArray(p) ||
          p.length < 2 ||
          !p.slice(0, 2).every(Number.isFinite)
        )
          throw Error("Coordinates must be finite numbers.");
        points++;
      }
      if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1])
        throw Error("Polygon rings must be closed.");
    }
  }
  if (points > 30000)
    throw Error("Limit: 30,000 positions. Simplify the map before importing.");
  return data;
}
// Exact shared-edge topology: point contacts do not establish adjacency.
export function adjacency(data) {
  validate(data);
  const graph = data.features.map(() => new Set()),
    edges = new Map();
  data.features.forEach((f, i) =>
    f.geometry.coordinates.forEach((ring) => {
      for (let j = 1; j < ring.length; j++) {
        const a = ring[j - 1].slice(0, 2).join(","),
          b = ring[j].slice(0, 2).join(",");
        if (a === b) continue;
        const key = [a, b].sort().join("|");
        for (const other of edges.get(key) || [])
          if (other !== i) {
            graph[i].add(other);
            graph[other].add(i);
          }
        if (!edges.has(key)) edges.set(key, new Set());
        edges.get(key).add(i);
      }
    }),
  );
  return graph;
}
export function colorGraph(graph) {
  const colors = Array(graph.length).fill(-1);
  for (let step = 0; step < graph.length; step++) {
    let best = -1,
      bestS = -1,
      bestD = -1;
    graph.forEach((neighbors, i) => {
      if (colors[i] >= 0) return;
      const s = new Set(
        [...neighbors].map((j) => colors[j]).filter((c) => c >= 0),
      ).size;
      if (s > bestS || (s === bestS && neighbors.size > bestD)) {
        best = i;
        bestS = s;
        bestD = neighbors.size;
      }
    });
    const used = new Set([...graph[best]].map((i) => colors[i]));
    let c = 0;
    while (used.has(c)) c++;
    colors[best] = c;
  }
  return colors;
}
export function luminance(hex) {
  const rgb = hex
    .match(/[a-f\d]{2}/gi)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
export function contrast(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function textColor(bg) {
  return contrast(bg, "#000000") > contrast(bg, "#ffffff")
    ? "#000000"
    : "#ffffff";
}
export function sample() {
  const names = [
    "Moon Dock",
    "Boba Bay",
    "Cloud Club",
    "Peach Pier",
    "Jelly Jungle",
    "Mochi Meadow",
    "Pudding Park",
    "Sunny Side",
    "Lilypad Lane",
    "Sprinkle Sq.",
    "Cookie Cove",
    "Doodle Den",
    "Mango Market",
    "Bubble Brook",
    "Pickle Place",
    "Waffle Woods",
    "Lemon Loft",
    "Berry Beach",
    "Star Studio",
  ];
  const features = [];
  for (let q = -2; q <= 2; q++)
    for (let r = -2; r <= 2; r++)
      if (Math.abs(q + r) <= 2) {
        const x = 1.5 * q,
          y = Math.sqrt(3) * (r + q / 2),
          ring = Array.from({ length: 6 }, (_, i) => [
            +(x + Math.cos((i * Math.PI) / 3)).toFixed(6),
            +(y + Math.sin((i * Math.PI) / 3)).toFixed(6),
          ]);
        ring.push([...ring[0]]);
        features.push({
          type: "Feature",
          properties: { name: names[features.length] },
          geometry: { type: "Polygon", coordinates: [ring] },
        });
      }
  return { type: "FeatureCollection", features };
}
