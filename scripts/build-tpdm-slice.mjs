// Builds public/data/tpdm-slice.json for the "Try it" map on the traffic-signs page.
// It downloads the public sign survey data published by Lecberg/hk-tpdm-traffic-signs-markings,
// keeps the named signs within MAX_KM of four places, and writes a compact file.
// Run with: node scripts/build-tpdm-slice.mjs
import { writeFile, mkdir } from "node:fs/promises";

const SITE = "https://lecberg.github.io/hk-tpdm-traffic-signs-markings/";
const RAW = "https://raw.githubusercontent.com/Lecberg/hk-tpdm-traffic-signs-markings/main/";
const MAX_KM = 1.5;
const PLACE_NAMES = ["Mong Kok", "Tsim Sha Tsui", "Causeway Bay", "Central District"];
const SIGN_TYPES = 8; // how many sign types the drop-down offers

const getJson = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} for ${url}`);
  return r.json();
};

// Same distance as a straight line on the earth's surface (haversine), in km.
function km(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(a));
}

const [allPlaces, meta, index] = await Promise.all([
  getJson(RAW + "data/places.json"),
  getJson(RAW + "data/sign-metadata.json"),
  getJson(SITE + "map-data/index.json"),
]);

const places = PLACE_NAMES.map((name) => {
  const p = allPlaces.find((x) => x.name_en === name);
  if (!p) throw new Error(`Place not found: ${name}`);
  return { name: name === "Central District" ? "Central" : name, lat: p.latitude, lon: p.longitude };
});

// Sign names, keyed by the code used in the map data ("TS101" for drawing "TS_101").
const names = new Map(meta.map((m) => [m.code.replace("_", ""), { code: m.code, name: m.name_en }]));

// Work out which data files cover a box around each place (same rule as the TPDM map).
const size = index.cell;
const splits = index.splits || {};
const files = new Set();
for (const p of places) {
  const dLat = MAX_KM / 111.32;
  const dLon = MAX_KM / (111.32 * Math.cos((p.lat * Math.PI) / 180));
  const [w, e, s, n] = [p.lon - dLon, p.lon + dLon, p.lat - dLat, p.lat + dLat];
  for (let x = Math.floor(w / size); x <= Math.floor(e / size); x++) {
    for (let y = Math.floor(s / size); y <= Math.floor(n / size); y++) {
      const key = `${x}_${y}`;
      if (!index.cells[key]) continue;
      const split = splits[key];
      if (!split) { files.add(key); continue; }
      const sub = size / split.n;
      const i0 = Math.max(0, Math.floor((w - x * size) / sub)), i1 = Math.min(split.n - 1, Math.floor((e - x * size) / sub));
      const j0 = Math.max(0, Math.floor((s - y * size) / sub)), j1 = Math.min(split.n - 1, Math.floor((n - y * size) / sub));
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
        if (split.parts[`${i}-${j}`]) files.add(`${key}_${i}-${j}`);
      }
    }
  }
}

const rows = (await Promise.all([...files].map((f) => getJson(`${SITE}map-data/${f}.json`)))).flat();

// Keep named signs within MAX_KM of any place.
const kept = rows.filter(([code, lon, lat]) => names.has(code) && places.some((p) => km(p.lat, p.lon, lat, lon) <= MAX_KM));

// Offer the most common sign types; Stop (TS101) always first.
const freq = new Map();
for (const [code] of kept) freq.set(code, (freq.get(code) || 0) + 1);
const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
const chosen = ["TS101", ...top.filter((c) => c !== "TS101")].slice(0, SIGN_TYPES);
const signs = chosen.map((c) => names.get(c));
const codeIndex = new Map(chosen.map((c, i) => [c, i]));

const points = kept
  .filter(([code]) => codeIndex.has(code))
  .map(([code, lon, lat]) => [codeIndex.get(code), Math.round(lon * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5]);

const out = {
  source: "Hong Kong Transport Department traffic sign survey, via github.com/Lecberg/hk-tpdm-traffic-signs-markings",
  builtAt: new Date().toISOString().slice(0, 10),
  maxKm: MAX_KM,
  places,
  signs,
  points,
};

await mkdir("public/data", { recursive: true });
const text = JSON.stringify(out);
await writeFile("public/data/tpdm-slice.json", text);

// Self-check against the assistant's answer: 36 Stop signs within 1 km of Mong Kok.
const mk = places[0];
const stops = points.filter(([s, lon, lat]) => s === 0 && km(mk.lat, mk.lon, lat, lon) <= 1).length;
console.log(`files ${files.size}, points ${points.length}, ${(text.length / 1024).toFixed(0)} KB`);
console.log("sign types:", signs.map((s) => `${s.code} ${s.name} (${freq.get(s.code.replace("_", ""))})`).join("; "));
console.log(`Stop signs within 1 km of Mong Kok: ${stops}`);
