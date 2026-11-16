import type { Observation } from "../types";

export interface ComparisonPair {
  earlier: Observation;
  later: Observation;
  elapsedDays: number;
}

export function chooseComparisonPair(
  observations: Observation[],
): ComparisonPair | null {
  const byDetector = new Map<number, Observation[]>();

  for (const observation of observations) {
    const matches = byDetector.get(observation.detector) ?? [];
    matches.push(observation);
    byDetector.set(observation.detector, matches);
  }

  let bestPair: ComparisonPair | null = null;
  for (const detectorObservations of byDetector.values()) {
    const sorted = [...detectorObservations].sort(
      (a, b) => a.observation_mjd - b.observation_mjd,
    );

    for (let first = 0; first < sorted.length; first += 1) {
      for (let second = first + 1; second < sorted.length; second += 1) {
        const earlier = sorted[first];
        const later = sorted[second];
        if (earlier.observation_id === later.observation_id) continue;

        const elapsedDays = later.observation_mjd - earlier.observation_mjd;
        if (elapsedDays <= 0) continue;
        if (!bestPair || elapsedDays > bestPair.elapsedDays) {
          bestPair = { earlier, later, elapsedDays };
        }
      }
    }
  }

  return bestPair;
}

export function formatObservationTime(isoTime: string): string {
  const normalized = isoTime.trim().replace(" ", "T");
  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized)
    ? normalized
    : `${normalized}Z`;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Timestamp unavailable";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

export function formatWavelengthRange(
  minimum: number | null,
  maximum: number | null,
): string {
  if (minimum === null || maximum === null) return "Wavelength unavailable";
  return `${minimum.toFixed(3)}–${maximum.toFixed(3)} μm`;
}

export function formatElapsedDays(days: number): string {
  if (days < 1) return `${(days * 24).toFixed(1)} hours`;
  return `${days.toFixed(2)} days`;
}
