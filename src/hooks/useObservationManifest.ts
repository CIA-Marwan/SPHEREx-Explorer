import { useQuery } from "@tanstack/react-query";
import type { Observation } from "../types";
import { publicAsset } from "../lib/deployment";

export interface SavedObservation {
  observation: Observation;
  image_file: string;
  fits_date_obs: string;
  fits_bunit: string;
  processing: string;
  wavelength_note: string;
}

export interface SavedRegion {
  id: string;
  label: string;
  ra_deg: number;
  dec_deg: number;
  observations: SavedObservation[];
  comparisons?: SavedComparison[];
}

export interface SavedComparison {
  id: string;
  earlier: Observation;
  later: Observation;
  before_image: string;
  after_image: string;
  calibration_url: string;
  method: string;
  limitations: string;
  details: {
    central_wavelength_microns: number;
    later_central_wavelength_microns: number;
    central_bandwidth_microns: number;
    valid_pixels: number;
    total_pixels: number;
  };
}

export function useObservationManifest() {
  return useQuery({
    queryKey: ["observation-manifest"],
    queryFn: async (): Promise<{ regions: SavedRegion[] }> => {
      const response = await fetch(publicAsset("observations/manifest.json"));
      if (!response.ok) throw new Error(`Observation manifest could not be loaded (HTTP ${response.status}).`);
      return response.json();
    },
  });
}
