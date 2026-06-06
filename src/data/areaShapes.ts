import { geoArea } from "d3-geo";
import type { Feature, FeatureCollection, MultiPoint, Polygon } from "geojson";
import { areaById } from "./areas";

// Rough, hand-authored basin outlines in GeoJSON [lng, lat] order. The map draws
// the opaque land layer on top of these, so a shape only needs to loosely bound
// its sea region; the coastline masks any overlap onto land. Add more areas here
// (keyed by the area id from areas.ts) to extend the map beyond the Mediterranean.
const areaRings: Record<string, [number, number][]> = {
  // Mediterranean basin. The shape has NO stroke and sits behind the opaque land
  // layer, so its visible edge is the real coastline (from the land mask). To keep
  // it clean, every vertex is pushed DEEP inland (Sahara, central Anatolia, the
  // Alps, Iberian interior) so no edge runs through open coastal water; the shape
  // only "pinches" to cross the narrow straits that connect the Med to other seas:
  // Gibraltar (W), the Dardanelles (NE) and the Gulf of Suez (SE). Those short caps
  // are the only fill edges that touch water, and they read as intentional borders.
  "south-europe-med": [
    [-5.5, 36.2], // Gibraltar, Spain side (strait pinch)
    [-2.5, 39.5], // inland Andalusia / Murcia
    [0.5, 42.3], // inland Aragon / Catalonia (east of the Bay of Biscay)
    [5.0, 45.5], // inland SE France
    [9.5, 46.8], // inland northern Italy / Alps
    [14.0, 47.0], // inland Slovenia / Austria (covers the north Adriatic)
    [19.0, 44.5], // inland Bosnia / Croatia
    [22.0, 42.5], // inland Serbia / North Macedonia
    [26.0, 41.5], // inland Thrace, north of the Dardanelles (strait pinch N)
    [27.0, 39.5], // inland western Anatolia, south of the Dardanelles (strait pinch S)
    [31.0, 38.0], // inland SW Anatolia
    [35.0, 37.5], // inland south-central Anatolia
    [37.5, 36.5], // inland SE Anatolia
    [38.0, 34.0], // inland Syria
    [36.5, 31.5], // inland Jordan
    [34.5, 30.0], // inland Israel / northern Sinai (north of the Red Sea)
    [32.0, 29.5], // inland NE Egypt, west of the Gulf of Suez
    [26.0, 28.5], // deep inland Egyptian desert
    [19.0, 28.5], // deep inland Libyan desert (well south of the Gulf of Sidra)
    [12.0, 30.0], // inland western Libya / southern Tunisia
    [6.0, 33.0], // inland Tunisia / Algeria
    [0.0, 34.5], // inland Algeria
    [-4.0, 34.2], // inland northern Morocco
    [-5.5, 35.6], // Gibraltar, Morocco side (strait pinch)
  ],

  // First-draft sea zones for the other active cruise regions. Same principle as
  // the Med: vertices pushed onto land where the region is coastal (the land mask
  // hides them) and left in open water where the region faces open ocean. These are
  // rough starting points placed roughly correctly — refine vertices per region.

  // North Sea + Baltic + Norwegian coast + British Isles (the broad "Nordeuropa"
  // umbrella). Shares its southern seam (lat 49, Atlantic -> inland France) with
  // Westeuropa so the two abut without a gap.
  "northern-europe": [
    [3, 49], // shared seam with Westeuropa (continental end)
    [9, 51], // inland Germany (German Bight)
    [19, 52], // inland Poland (S Baltic)
    [26, 55], // inland Baltic states
    [31, 59], // inland (Gulf of Finland)
    [31, 64], // inland N Finland (Gulf of Bothnia)
    [27, 71], // North Cape
    [14, 68], // off northern Norway
    [4, 63], // Norwegian Sea
    [-8, 61], // Atlantic NW of Scotland
    [-14, 56], // Atlantic W of Ireland
    [-17, 49], // shared seam with Westeuropa (Atlantic end)
  ],

  // Atlantic seaboard of SW Europe: Channel approaches, Bay of Biscay, Iberian
  // Atlantic. Tiles against Nordeuropa (lat-49 seam, N), Kanaren (lat-33 seam off
  // Morocco, S) and Südeuropa (Gibraltar, E) using shared edge coordinates.
  "western-europe": [
    [3, 49], // shared seam with Nordeuropa (continental)
    [1, 47], // inland W France
    [-2, 44], // inland SW France (Biscay)
    [-9, 41], // inland Portugal / W Spain
    [-5.5, 36.2], // Gibraltar (shared with Südeuropa)
    [-6, 35.5], // inland N Morocco (Atlantic side of the strait)
    [-9, 33], // shared seam with Kanaren (Moroccan coast)
    [-18, 33], // shared seam with Kanaren (Atlantic)
    [-17, 49], // shared seam with Nordeuropa (Atlantic)
  ],

  // Canary Islands + Madeira + the NW African Atlantic coast. Shares its northern
  // seam (lat 33 off Morocco) with Westeuropa.
  "canaries": [
    [-18, 33], // shared seam with Westeuropa (Atlantic)
    [-9, 33], // shared seam with Westeuropa (Moroccan coast)
    [-7, 28], // inland Morocco / Western Sahara
    [-9, 22], // inland Western Sahara / Mauritania (S)
    [-18, 25], // open Atlantic SW
  ],

  // Caribbean Sea: the Lesser Antilles arc out to Barbados (E), the Greater Antilles
  // (Jamaica, Hispaniola), and the western Caribbean (Belize, Honduras, Panama,
  // Cartagena). Enclosed by the islands and the Central/South American mainland.
  "central-america-caribbean": [
    [-89, 17], // inland Belize / Yucatán
    [-84, 8], // inland Costa Rica / Panama (covers Limón, Colón)
    [-74, 8], // inland Colombia (covers Cartagena)
    [-60, 11], // off Trinidad
    [-58, 14], // east of Barbados
    [-61, 19], // off the northern Lesser Antilles
    [-67, 21], // north of Puerto Rico
    [-76, 22], // north of Hispaniola / Cuba
    [-86, 21], // off western Cuba / Yucatán Channel
  ],

  // Southern African waters around the Cape (Atlantic + Indian Ocean).
  "south-africa": [
    [17, -29],
    [26, -28],
    [33, -29],
    [34, -35],
    [26, -38],
    [16, -36],
    [13, -31],
  ],

  // US / Canada Atlantic seaboard, from Florida & the Bahamas (Miami, Port Canaveral,
  // Nassau) up the coast (New York, Boston, Norfolk) to the Maritimes & Gulf of St
  // Lawrence (Halifax, Newfoundland, Quebec). Deep inland on the W; open Atlantic E.
  "north-america": [
    [-82, 30], // inland Florida (covers Miami / Port Canaveral)
    [-80, 24], // off south Florida / Bahamas
    [-70, 25], // off the Bahamas (SE)
    [-60, 35], // open Atlantic (E)
    [-50, 47], // off Newfoundland (Grand Banks)
    [-59, 50], // inland Newfoundland / Gulf of St Lawrence
    [-70, 48], // inland Quebec / Gaspé
    [-73, 44], // inland New England / New York State
    [-78, 36], // inland Mid-Atlantic (Chesapeake / Carolinas)
  ],

  // East & SE Asia seaboard, from the Singapore hub up the whole East Asian coast to
  // Japan/Korea (real ports: Singapore, Bangkok, Hong Kong, Vietnam, Penang, plus
  // Yokohama/Tokyo, Osaka, Busan). Deep inland on the Asian mainland; Pacific on the E.
  "asia": [
    [99, 15], // inland Thailand (covers the Gulf of Thailand / Bangkok)
    [100, 5], // inland Malaysia (toward Singapore)
    [104, 0], // Singapore / equator
    [112, 3], // off NW Borneo (South China Sea, S)
    [122, 13], // off the Philippines (South China Sea, E)
    [127, 24], // East China Sea (off Taiwan / Ryukyu)
    [135, 33], // Pacific south of Japan
    [144, 36], // Pacific off Tokyo / Yokohama
    [143, 42], // off northern Honshu
    [130, 40], // inland Korea / NE China (Sea of Japan, W)
    [118, 30], // inland eastern China
    [108, 19], // inland S China / Hainan (Gulf of Tonkin)
    [103, 16], // inland Vietnam / Cambodia
  ],
};

// Camera framing for the map, independent of the shaded region. This is also the
// most zoomed-out state (zoom starts here), so it frames most of the world: you
// see global context and zoom IN towards a region. Tweak to change the default
// view or pan it. [lng west/east, lat south/north].
export const MAP_VIEW_BOUNDS = {
  west: -180,
  east: 180,
  south: -56,
  north: 72,
};

// Two opposite corners are enough to frame the projection via fitExtent, and a
// MultiPoint sidesteps any polygon winding concerns.
export const mapViewExtent: MultiPoint = {
  type: "MultiPoint",
  coordinates: [
    [MAP_VIEW_BOUNDS.west, MAP_VIEW_BOUNDS.south],
    [MAP_VIEW_BOUNDS.east, MAP_VIEW_BOUNDS.north],
  ],
};

// d3-geo treats a ring covering more than a hemisphere as the *complement* of the
// intended region (nearly the whole globe). geoArea is the ground truth: if the
// closed ring spans > 2π steradians, reverse it so the small interior is what
// gets filled and hit-tested. This avoids guessing planar vs. spherical winding.
function orientedRing(ring: [number, number][]): [number, number][] {
  const closed: [number, number][] = [...ring, ring[0]];
  const candidate: Polygon = { type: "Polygon", coordinates: [closed] };
  return geoArea(candidate) > 2 * Math.PI ? [...closed].reverse() : closed;
}

export type AreaShapeProperties = { areaId: string; label: string; color: string };
export type AreaShapeFeature = Feature<Polygon, AreaShapeProperties>;

export const areaShapes: AreaShapeFeature[] = Object.entries(areaRings).map(([areaId, ring]) => {
  const area = areaById.get(areaId);
  return {
    type: "Feature",
    properties: {
      areaId,
      label: area?.label ?? areaId,
      color: area?.color ?? "#2f9c95",
    },
    geometry: {
      type: "Polygon",
      coordinates: [orientedRing(ring)],
    },
  };
});

export const areaShapeById = new Map(areaShapes.map((shape) => [shape.properties.areaId, shape]));

export const areaShapesCollection: FeatureCollection<Polygon, AreaShapeProperties> = {
  type: "FeatureCollection",
  features: areaShapes,
};
