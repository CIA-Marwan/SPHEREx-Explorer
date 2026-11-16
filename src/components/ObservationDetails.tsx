import { ExternalLink, Radio, Ruler, Timer } from "lucide-react";
import { formatObservationTime, formatWavelengthRange } from "../lib/science";
import type { Observation } from "../types";

export function ObservationDetails({ observation }: { observation: Observation }) {
  return (
    <section className="metadata-card" aria-label={`Archive metadata for ${observation.observation_id}`}>
      <div className="metadata-heading">
        <div>
          <p className="eyebrow">ARCHIVE METADATA</p>
          <h3>{observation.observation_id}</h3>
        </div>
        <a
          className="icon-link"
          href={observation.access_url}
          target="_blank"
          rel="noreferrer"
          aria-label="Open original FITS product at IRSA"
          title="Open the original FITS product at IRSA"
        >
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      </div>
      <dl className="metadata-list">
        <div><dt><Radio size={14} /> Detector</dt><dd>D{observation.detector}</dd></div>
        <div><dt><Timer size={14} /> Observation (UTC)</dt><dd>{formatObservationTime(observation.observation_time_utc)}</dd></div>
        <div><dt><Ruler size={14} /> Detector wavelength range</dt><dd>{formatWavelengthRange(observation.wavelength_min_microns, observation.wavelength_max_microns)}</dd></div>
        <div><dt>Calibration level</dt><dd>{observation.calibration_level ?? "Not reported"}</dd></div>
        <div><dt>Exposure</dt><dd>{observation.exposure_seconds === null ? "Not reported" : `${observation.exposure_seconds.toFixed(2)} s`}</dd></div>
        <div><dt>Center</dt><dd>{observation.ra_deg.toFixed(5)}°, {observation.dec_deg.toFixed(5)}°</dd></div>
        <div><dt>Archive collection</dt><dd>{observation.release}</dd></div>
      </dl>
      <p className="metadata-source">
        Original product: <a href={observation.access_url} target="_blank" rel="noreferrer">SPHEREx FITS at IRSA <ExternalLink size={12} /></a>
      </p>
    </section>
  );
}
