import { describe, expect, it } from "vitest";
import {
  chooseComparisonPair,
  formatElapsedDays,
  formatObservationTime,
  formatWavelengthRange,
} from "./science";
import type { Observation } from "../types";

function observation(
  id: string,
  detector: number,
  mjd: number,
  observationId = id,
): Observation {
  return {
    id,
    observation_id: observationId,
    detector,
    ra_deg: 127.7,
    dec_deg: -39.1,
    observation_mjd: mjd,
    observation_time_utc: "2025-04-29T14:14:38.121",
    wavelength_min_microns: 0.7455,
    wavelength_max_microns: 1.1167,
    calibration_level: 2,
    exposure_seconds: 113.58,
    access_url: "https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/item.fits",
    release: "spherex_dr1",
    archive_record_url: "https://irsa.ipac.caltech.edu/applications/spherex",
  };
}

describe("archive observation helpers", () => {
  it("only compares distinct observation IDs from the same detector", () => {
    const pair = chooseComparisonPair([
      observation("a1", 1, 60000, "a"),
      observation("a4", 4, 60020, "a"),
      observation("b1", 1, 60002, "b"),
      observation("c1", 1, 60015, "c"),
    ]);

    expect(pair?.earlier.observation_id).toBe("a");
    expect(pair?.later.observation_id).toBe("c");
    expect(pair?.elapsedDays).toBe(15);
  });

  it("does not create a comparison when archive results have only one observation", () => {
    expect(chooseComparisonPair([observation("a1", 1, 60000, "a")])).toBeNull();
  });

  it("formats only available wavelength bounds", () => {
    expect(formatWavelengthRange(0.7455, 1.1167)).toBe("0.746–1.117 μm");
    expect(formatWavelengthRange(null, 1.1)).toBe("Wavelength unavailable");
  });

  it("formats archive timestamps in UTC and handles invalid values", () => {
    expect(formatObservationTime("2025-04-29T14:14:38.121")).toContain("UTC");
    expect(formatObservationTime("not a timestamp")).toBe("Timestamp unavailable");
  });

  it("reports the actual elapsed observation time", () => {
    expect(formatElapsedDays(0.5)).toBe("12.0 hours");
    expect(formatElapsedDays(12.25)).toBe("12.25 days");
  });
});
