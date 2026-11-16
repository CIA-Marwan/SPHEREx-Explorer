export type Collection =
  | "spherex_dr1"
  | "spherex_dr1_deep"
  | "spherex_qr3"
  | "spherex_qr3_deep";

export interface SearchRequest {
  ra: number;
  dec: number;
  radius: number;
  collection: Collection;
  detector?: number;
}

export interface Observation {
  id: string;
  observation_id: string;
  detector: number;
  ra_deg: number;
  dec_deg: number;
  observation_mjd: number;
  observation_time_utc: string;
  wavelength_min_microns: number | null;
  wavelength_max_microns: number | null;
  calibration_level: number | null;
  exposure_seconds: number | null;
  access_url: string;
  release: Collection;
  archive_record_url: string;
}

export interface ObservationSearch {
  collection: Collection;
  center_ra_deg: number;
  center_dec_deg: number;
  radius_deg: number;
  count: number;
  truncated: boolean;
  observations: Observation[];
}

export interface ResolvedObject {
  name: string;
  ra_deg: number;
  dec_deg: number;
  object_type: string | null;
  catalog: "SIMBAD";
  catalog_url: string;
}
