import { describe, expect, it } from "vitest";
import { geoContains } from "d3-geo";
import { areaShapeById, areaShapes } from "../src/data/areaShapes";

describe("area shapes", () => {
  it("includes the Mediterranean shape", () => {
    expect(areaShapeById.has("south-europe-med")).toBe(true);
  });

  it("uses closed linear rings", () => {
    for (const shape of areaShapes) {
      const ring = shape.geometry.coordinates[0];
      expect(ring[0]).toEqual(ring[ring.length - 1]);
    }
  });

  it("contains Mediterranean points and excludes far-away ones (guards ring winding)", () => {
    const med = areaShapeById.get("south-europe-med")!;
    // Inside the basin (lng, lat): Tyrrhenian and Ionian seas.
    expect(geoContains(med, [12.5, 39.5])).toBe(true);
    expect(geoContains(med, [18, 36])).toBe(true);
    // Outside: a clockwise ring would invert the interior and wrongly contain these.
    expect(geoContains(med, [-30, 40])).toBe(false);
    expect(geoContains(med, [70, 10])).toBe(false);
  });

  // Each region must contain a representative sea point in its expected location.
  // This guards placement and ring winding for every shape.
  it.each([
    ["northern-europe", [4, 57] as [number, number]], // North Sea
    ["western-europe", [-8, 44] as [number, number]], // Bay of Biscay
    ["canaries", [-16, 28] as [number, number]], // off the Canary Islands
    ["central-america-caribbean", [-75, 15] as [number, number]], // central Caribbean
    ["south-africa", [20, -34] as [number, number]], // off Cape Town
    ["north-america", [-66, 43] as [number, number]], // Gulf of Maine
    ["asia", [125, 28] as [number, number]], // East China Sea (toward Japan/Korea)
  ])("places %s around its expected waters", (id, point) => {
    const shape = areaShapeById.get(id)!;
    expect(shape).toBeDefined();
    expect(geoContains(shape, point)).toBe(true);
    // No region should swallow the opposite side of the globe.
    expect(geoContains(shape, [-point[0], -point[1]])).toBe(false);
  });
});
