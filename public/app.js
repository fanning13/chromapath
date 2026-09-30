import {
  palettes,
  sample,
  validate,
  adjacency,
  colorGraph,
  textColor,
  contrast,
} from "./core.js";
const $ = (id) => document.getElementById(id),
  ns = "http://www.w3.org/2000/svg";
let data = sample(),
  result;
function draw() {
  const graph = adjacency(data),
    indices = colorGraph(graph),
    palette = palettes[$("palette").value];
  const count = Math.max(...indices) + 1;
  if (count > palette.length)
    throw Error(`Map needs ${count} colors; palette has ${palette.length}.`);
  const coords = data.features.flatMap((f) => f.geometry.coordinates.flat());
  const xs = coords.map((p) => p[0]),
    ys = coords.map((p) => p[1]);
  const xmin = Math.min(...xs),
    ymin = Math.min(...ys),
    xmax = Math.max(...xs),
    ymax = Math.max(...ys);
  const scale = Math.min(720 / (xmax - xmin || 1), 440 / (ymax - ymin || 1));
  const dx = (800 - (xmax - xmin) * scale) / 2,
    dy = (520 - (ymax - ymin) * scale) / 2;
  const pt = (p) => [
    dx + (p[0] - xmin) * scale,
    520 - dy - (p[1] - ymin) * scale,
  ];
  $("map").replaceChildren();
  result = structuredClone(data);
  let minContrast = 21;
  data.features.forEach((f, i) => {
    const fill = palette[indices[i]],
      path = document.createElementNS(ns, "path");
    path.setAttribute(
      "d",
      f.geometry.coordinates
        .map((r) => "M" + r.map((p) => pt(p).join(",")).join("L") + "Z")
        .join(""),
    );
    path.setAttribute("fill", fill);
    path.setAttribute("stroke", "#fffdf7");
    path.setAttribute("stroke-width", "3");
    path.setAttribute("fill-rule", "evenodd");
    const name = String(f.properties?.name || `Region ${i + 1}`),
      title = document.createElementNS(ns, "title");
    title.textContent = name;
    path.append(title);
    $("map").append(path);
    const ring = f.geometry.coordinates[0].slice(0, -1),
      center = pt([
        ring.reduce((s, p) => s + p[0], 0) / ring.length,
        ring.reduce((s, p) => s + p[1], 0) / ring.length,
      ]);
    const label = document.createElementNS(ns, "text");
    label.setAttribute("x", center[0]);
    label.setAttribute("y", center[1]);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "11");
    label.setAttribute("fill", textColor(fill));
    label.textContent = name.slice(0, 18);
    $("map").append(label);
    minContrast = Math.min(minContrast, contrast(fill, textColor(fill)));
    result.features[i].properties = {
      ...f.properties,
      fill,
      "fill-opacity": 1,
      stroke: "#fffdf7",
    };
  });
  $("swatches").replaceChildren(
    ...palette.map((color) => {
      const s = document.createElement("span");
      s.style.background = color;
      s.title = color;
      return s;
    }),
  );
  $("stats").textContent = `${data.features.length} REGIONS / ${count} COLORS`;
  $("status").textContent =
    `${graph.reduce((s, n) => s + n.size, 0) / 2} shared borders · No adjacent color conflicts · Minimum label contrast ${minContrast.toFixed(1)}:1. Color distinction is not a color-blindness certification.`;
}
function download(body, type, name) {
  const url = URL.createObjectURL(new Blob([body], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("palette").onchange = draw;
$("reset").onclick = () => {
  data = sample();
  draw();
};
$("upload").onchange = async (e) => {
  const previous = data;
  try {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2e6) throw Error("Use a file smaller than 2 MB.");
    data = validate(JSON.parse(await file.text()));
    draw();
  } catch (err) {
    data = previous;
    draw();
    $("status").textContent = err.message;
  } finally {
    e.target.value = "";
  }
};
$("export").onclick = () =>
  download(
    JSON.stringify(result, null, 2),
    "application/geo+json",
    "chromapath.geojson",
  );
$("svg").onclick = () => {
  const svg = $("map").cloneNode(true);
  svg.setAttribute("xmlns", ns);
  download(
    new XMLSerializer().serializeToString(svg),
    "image/svg+xml",
    "chromapath.svg",
  );
};
draw();
