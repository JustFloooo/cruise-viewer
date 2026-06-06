import { describe, expect, it } from "vitest";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection } from "geojson";
import landTopo from "world-atlas/land-110m.json";
import { areaShapeById, mapViewExtent } from "../src/data/areaShapes";

const landData = landTopo as unknown as { objects: { land: object } };
const landGeo = feature(landData as never, landData.objects.land as never) as
  | Feature
  | FeatureCollection;

describe("map projection pipeline", () => {
  const width = 960;
  const height = 600;
  const pad = 12;
  const projection = geoMercator().fitExtent(
    [
      [pad, pad],
      [width - pad, height - pad],
    ],
    mapViewExtent,
  );
  const path = geoPath(projection);

  it("renders the merged world land to a substantial path", () => {
    const d = path(landGeo);
    expect(typeof d).toBe("string");
    expect((d ?? "").length).toBeGreaterThan(1000);
    expect(d!.startsWith("M")).toBe(true);
  });

  it("renders the Mediterranean shape to a path", () => {
    const med = areaShapeById.get("south-europe-med")!;
    const d = path(med);
    expect(d?.startsWith("M")).toBe(true);
  });

  it("projects a Mediterranean port within the fitted viewport", () => {
    const xy = projection([2.17, 41.37]); // Barcelona (lng, lat)
    expect(xy).not.toBeNull();
    const [x, y] = xy!;
    expect(Number.isFinite(x)).toBe(true);
    expect(Number.isFinite(y)).toBe(true);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThanOrEqual(width);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThanOrEqual(height);
  });
});
