import { describe, expect, it } from "vitest";
import {
  cruiseAreas,
  deployments,
  ships,
  shipAreaWindows,
} from "../src/data";

function distribution<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const bucket = key(item);
    counts[bucket] = (counts[bucket] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

// These snapshots characterize the CURRENT derived data. They are the regression
// net for the refactor: the derived ships/deployments/windows must stay identical.

describe("cruise areas", () => {
  it("exposes the stable set of area ids", () => {
    expect(cruiseAreas.map((area) => area.id)).toMatchInlineSnapshot(`
      [
        "northern-europe",
        "south-europe-med",
        "western-europe",
        "south-africa",
        "baltic",
        "orient",
        "nordland-gb",
        "north-america",
        "asia",
        "central-america-caribbean",
        "canaries",
      ]
    `);
  });
});

describe("ships", () => {
  it("derives a stable, sorted fleet", () => {
    expect(ships.length).toMatchInlineSnapshot(`9`);
    expect(ships.map((ship) => ship.code)).toMatchInlineSnapshot(`
      [
        "MEINS1",
        "MEINS2",
        "MEINS3",
        "MEINS4",
        "MEINS5",
        "MEINS6",
        "MEINS7",
        "MEINSF",
        "MEINSR",
      ]
    `);
    expect(ships.map((ship) => `${ship.code}:${ship.id}:${ship.name}`)).toMatchInlineSnapshot(`
      [
        "MEINS1:ms1:Mein Schiff 1",
        "MEINS2:ms2:Mein Schiff 2",
        "MEINS3:ms3:Mein Schiff 3",
        "MEINS4:ms4:Mein Schiff 4",
        "MEINS5:ms5:Mein Schiff 5",
        "MEINS6:ms6:Mein Schiff 6",
        "MEINS7:ms7:Mein Schiff 7",
        "MEINSF:flow:Mein Schiff Flow",
        "MEINSR:relax:Mein Schiff Relax",
      ]
    `);
  });
});

describe("deployments", () => {
  it("derives a stable number of deployments", () => {
    expect(deployments.length).toMatchInlineSnapshot(`956`);
  });

  it("classifies deployments into a stable area distribution", () => {
    expect(distribution(deployments, (d) => d.areaId)).toMatchInlineSnapshot(`
      {
        "asia": 23,
        "baltic": 65,
        "canaries": 179,
        "central-america-caribbean": 154,
        "nordland-gb": 97,
        "north-america": 10,
        "south-africa": 37,
        "south-europe-med": 314,
        "western-europe": 77,
      }
    `);
  });

  it("keeps a stable per-ship deployment distribution", () => {
    expect(distribution(deployments, (d) => d.shipId)).toMatchInlineSnapshot(`
      {
        "flow": 97,
        "ms1": 82,
        "ms2": 71,
        "ms3": 72,
        "ms4": 143,
        "ms5": 138,
        "ms6": 86,
        "ms7": 124,
        "relax": 143,
      }
    `);
  });
});

describe("ship area windows", () => {
  it("derives a stable number of windows", () => {
    expect(shipAreaWindows.length).toMatchInlineSnapshot(`71`);
  });

  it("keeps a stable status distribution", () => {
    expect(distribution(shipAreaWindows, (w) => w.status)).toMatchInlineSnapshot(`
      {
        "bookable": 40,
        "short-trip": 24,
        "sold-out": 1,
        "transfer": 6,
      }
    `);
  });

  it("keeps a stable area distribution", () => {
    expect(distribution(shipAreaWindows, (w) => w.areaId)).toMatchInlineSnapshot(`
      {
        "asia": 2,
        "canaries": 7,
        "central-america-caribbean": 9,
        "north-america": 2,
        "northern-europe": 17,
        "south-africa": 4,
        "south-europe-med": 14,
        "western-europe": 16,
      }
    `);
  });
});
