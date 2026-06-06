import { describe, expect, it } from "vitest";
import {
  dateInDeployment,
  formatDisplayDate,
  fromUtcDay,
  positionOnRoute,
  progressInDeployment,
  sortedByStart,
  toUtcDay,
} from "../src/data/dateMath";

describe("toUtcDay / fromUtcDay", () => {
  it("round-trips an ISO date", () => {
    expect(fromUtcDay(toUtcDay("2027-01-01"))).toBe("2027-01-01");
    expect(fromUtcDay(toUtcDay("2026-06-05"))).toBe("2026-06-05");
  });

  it("counts whole days between dates", () => {
    expect(toUtcDay("2026-06-06") - toUtcDay("2026-06-05")).toBe(1);
    expect(toUtcDay("2026-07-05") - toUtcDay("2026-06-05")).toBe(30);
  });
});

describe("formatDisplayDate", () => {
  it("includes day, short month and year", () => {
    const formatted = formatDisplayDate("2026-11-17");
    expect(formatted).toContain("17");
    expect(formatted).toContain("Nov");
    expect(formatted).toContain("2026");
  });
});

describe("dateInDeployment", () => {
  const deployment = { start: "2026-06-05", end: "2026-06-15" };

  it("is inclusive of both bounds", () => {
    expect(dateInDeployment("2026-06-05", deployment)).toBe(true);
    expect(dateInDeployment("2026-06-15", deployment)).toBe(true);
    expect(dateInDeployment("2026-06-10", deployment)).toBe(true);
  });

  it("excludes dates outside the range", () => {
    expect(dateInDeployment("2026-06-04", deployment)).toBe(false);
    expect(dateInDeployment("2026-06-16", deployment)).toBe(false);
  });
});

describe("progressInDeployment", () => {
  const deployment = { start: "2026-06-05", end: "2026-06-15" };

  it("maps start to 0, end to 1 and the midpoint to 0.5", () => {
    expect(progressInDeployment("2026-06-05", deployment)).toBe(0);
    expect(progressInDeployment("2026-06-15", deployment)).toBe(1);
    expect(progressInDeployment("2026-06-10", deployment)).toBeCloseTo(0.5, 10);
  });
});

describe("positionOnRoute", () => {
  it("interpolates the midpoint of a two-point route", () => {
    expect(positionOnRoute([[0, 0], [10, 20]], 0.5)).toEqual([5, 10]);
  });

  it("returns the only point for a single-point route", () => {
    expect(positionOnRoute([[3, 4]], 0.7)).toEqual([3, 4]);
  });

  it("returns the origin for an empty route", () => {
    expect(positionOnRoute([], 0.5)).toEqual([0, 0]);
  });
});

describe("sortedByStart", () => {
  it("orders ascending by start and does not mutate the input", () => {
    const input = [
      { start: "2026-08-01" },
      { start: "2026-06-01" },
      { start: "2026-07-01" },
    ];
    const sorted = sortedByStart(input);
    expect(sorted.map((entry) => entry.start)).toEqual([
      "2026-06-01",
      "2026-07-01",
      "2026-08-01",
    ]);
    expect(input[0].start).toBe("2026-08-01");
  });
});
