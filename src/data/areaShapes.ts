import { geoArea } from "d3-geo";
import type { Feature, FeatureCollection, MultiPoint, Polygon } from "geojson";
import { areaById } from "./areas";

// Rough, hand-authored basin outlines in GeoJSON [lng, lat] order. The map draws
// the opaque land layer on top of these, so shapes can overlap land generously.
const areaRings: Record<string, [number, number][]> = {
  "south-europe-med": [
    [-5.5, 36.2],
    [-2.5, 39.5],
    [0.5, 42.3],
    [5, 45.5],
    [9.5, 46.8],
    [14, 47],
    [19, 44.5],
    [22, 42.5],
    [26, 41.5],
    [27, 39.5],
    [31, 38],
    [35, 37.5],
    [37.5, 36.5],
    [38, 34],
    [36.5, 31.5],
    [34.5, 30],
    [32.352, 30.32],
    [26, 28.5],
    [19, 28.5],
    [12, 30],
    [6, 33],
    [0, 34.5],
    [-4, 34.2],
    [-5.5, 35.6],
  ],

  "northern-europe": [
    [3, 49],
    [-17, 49],
    [-13.705, 57.94],
    [-4.167, 62.915],
    [5.937, 66.5],
    [14, 68],
    [25.628, 69.579],
    [31, 64],
    [31, 59],
    [26, 55],
    [19, 52],
    [9, 51],
  ],

  "western-europe": [
    [3, 49],
    [1.56, 46.724],
    [-1.143, 43.364],
    [-4.001, 39.824],
    [-5.5, 36.2],
    [-5.631, 33.786],
    [-9, 33],
    [-19.172, 33.034],
    [-17, 49],
  ],

  "canaries": [
    [-19.181, 33.043],
    [-9, 33],
    [-7, 28],
    [-16.615, 21.512],
    [-18.387, 25.823],
  ],

  "central-america-caribbean": [
    [-90.119, 16.498],
    [-86.844, 23.224],
    [-79.663, 23.989],
    [-69.6, 24.177],
    [-61.023, 19.963],
    [-59.158, 16.18],
    [-58.775, 11.791],
    [-60.846, 7.278],
    [-75.521, 7.501],
    [-79.413, 9.205],
    [-82.583, 8.668],
  ],

  "south-africa": [
    [19.771, -4.925],
    [46.368, -6.842],
    [54.584, -10.528],
    [54.064, -24.919],
    [38.578, -35.272],
    [16.221, -36.988],
    [6.755, -22.018],
    [9.517, -11.918],
  ],

  "north-america": [
    [-86.847, 23.23],
    [-87.575, 35.502],
    [-74.414, 44.319],
    [-63.959, 55.945],
    [-53.122, 54.266],
    [-47.88, 47.971],
    [-57.491, 36.718],
    [-69.698, 24.183],
    [-79.663, 23.986],
  ],

  "asia": [
    [89.195, 14.775],
    [91.73, 24.165],
    [103.309, 34.32],
    [116.504, 43.87],
    [136.748, 57.771],
    [147.513, 53.536],
    [148.497, 39.132],
    [137.597, 29.243],
    [131.369, 20.59],
    [130.014, -8.5],
    [119.578, -12.431],
    [105.639, -10.571],
    [93.49, 0.053],
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
