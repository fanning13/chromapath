---
name: map-palette
description: Color small GeoJSON polygon maps using ChromaPath palettes and shared-border graph coloring. Use for playful categorical region maps and SVG or GeoJSON exports, not quantitative choropleths.
---

Run `node scripts/color-map.mjs INPUT.geojson OUTPUT.geojson sorbet` relative to this skill directory. The bundled script and `scripts/core.mjs` are self-contained and require Node.js 22 or later, with no package installation. Use `--sample` instead of an input path for an original fictional candy-island map. Choose sorbet, forest, or ocean according to the requested mood. The script preserves geometry and existing properties and adds simplestyle fill and stroke properties. It refuses to overwrite output files; choose a new filename when needed.

Validate a FeatureCollection before processing. This version supports Polygon only, 250 features and 30,000 positions. Adjacency requires identical shared segments, in either direction. Differently segmented borders, overlaps, antimeridian crossings and reprojection need preprocessing; do not claim the result resolves them.

The script reports region, shared-border, and color counts. Report these and any palette overflow. For a visual preview, use the ChromaPath repository viewer and import the generated GeoJSON; the viewer can export SVG. Use black or white label text according to contrast. Do not imply color-blind safety from text contrast alone. For concave polygons the viewer's vertex-mean label position may lie outside the shape; state this limitation or omit labels when appropriate.
