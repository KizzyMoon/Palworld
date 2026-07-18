import fs from "node:fs";
import path from "node:path";
import cbor from "cbor";

const cdnBase = "https://cdn.th.gl/palworld";
const pageBase = "https://palworld.th.gl";
const dataPath = path.join(process.cwd(), "src", "data.ts");
const tempPath = path.join(process.env.TEMP || process.cwd(), "palworld-default.raw");

function findCoordinates(value) {
  if (!value) return null;
  if (Array.isArray(value) && value.length >= 2 && value.every((item) => typeof item === "number")) {
    return { x: Math.round(value[0]), y: Math.round(value[1]) };
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findCoordinates(item?.value ?? item);
      if (found) return found;
    }
  }
  return null;
}

function uniquePoints(points) {
  const seen = new Set();
  return points.filter((point) => {
    const key = `${point.x}:${point.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function palInternalFromImage(imageUrl) {
  const match = imageUrl.match(/\/T_([^/]+?)_icon_normal\.webp/);
  return match ? match[1].toLowerCase() : null;
}

function habitatLiteral(palName, coordinates) {
  return `[
      {
        locationId: "palpagos-island",
        time: "unknown",
        mapName: "Palpagos Island",
        spawnCount: ${coordinates.length},
        sourceUrl: "${pageBase}/guides/${encodeURIComponent(palName)}",
        notes: "Imported from TH.GL map markers. Spawn time is not specified by this import.",
        coordinates: ${JSON.stringify(coordinates)},
      },
    ]`;
}

const version = await fetch(`${cdnBase}/version.json`).then((response) => response.json());
const nodePath = version.more.nodes.default;
const nodeUrl = `${cdnBase}${nodePath}`;
const nodeBuffer = Buffer.from(await fetch(nodeUrl).then((response) => response.arrayBuffer()));
fs.writeFileSync(tempPath, nodeBuffer);

const decoded = cbor.decodeFirstSync(nodeBuffer).value;
const groups = decoded[3].map((entry) => entry.value ?? entry);
const markerGroups = new Map();

for (const group of groups) {
  const hasHeader = Array.isArray(group[1]);
  const type = String(hasHeader ? group[2] : group[0]);
  const spawnEntries = hasHeader ? group[4] : group[2];
  if (!Array.isArray(spawnEntries)) continue;
  const coordinates = uniquePoints(
    spawnEntries
      .map((spawn) => findCoordinates(spawn?.value ?? spawn))
      .filter(Boolean),
  );
  if (coordinates.length) markerGroups.set(type.toLowerCase(), coordinates);
}

let source = fs.readFileSync(dataPath, "utf8");
source = source.replace(
  /export const locations: Location\[] = \[[\s\S]*?\];/,
  `export const locations: Location[] = [
  {
    id: "palpagos-island",
    name: "Palpagos Island",
    region: "World Map",
    island: "Palpagos Island",
    description: "Imported spawn marker map from TH.GL. Area labels and day/night restrictions still need separate verification.",
    mapImage: "https://cdn.th.gl/palworld/map-tiles/default-733001e0986faa3f88b0a970412d7fb9/0/0/0.webp",
  },
];`,
);

console.log(`Lamball marker sample: ${markerGroups.get("sheepball")?.length ?? 0}`);

let matched = 0;
source = source.replace(/  \{\r?\n    id: \d+,[\s\S]*?    habitats: (?:\[\]|\[[\s\S]*?\r?\n    \]),/g, (block) => {
  const name = block.match(/name: "([^"]+)"/)?.[1];
  const image = block.match(/image: "([^"]+)"/)?.[1];
  const internal = image ? palInternalFromImage(image) : null;
  const coordinates = internal ? markerGroups.get(internal) : null;
  if (!name || !coordinates?.length) return block;
  matched += 1;
  return block.replace(/    habitats: (?:\[\]|\[[\s\S]*?\r?\n    \]),/, `    habitats: ${habitatLiteral(name, coordinates)},`);
});

fs.writeFileSync(dataPath, source);
console.log(`Matched habitats for ${matched} Pals from ${markerGroups.size} marker groups.`);
