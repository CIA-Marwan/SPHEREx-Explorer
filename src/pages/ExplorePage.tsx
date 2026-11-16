import { useState } from "react";
import { ArrowRight, Database, MapPin, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { ArchiveSearchForm } from "../components/ArchiveSearchForm";
import { FitsViewer } from "../components/FitsViewer";
import { ObservationDetails } from "../components/ObservationDetails";
import { QueryFeedback } from "../components/QueryFeedback";
import { useObservations } from "../hooks/useObservations";
import { useObservationManifest } from "../hooks/useObservationManifest";
import { formatObservationTime, formatWavelengthRange } from "../lib/science";
import { publicAsset, staticOnly } from "../lib/deployment";
import { useExplorerStore } from "../store/useExplorerStore";

export function ExplorePage() {
  const { search, query } = useObservations();
  const manifest = useObservationManifest();
  const [selectedId, setSelectedId] = useState("");
  const [savedRegionId, setSavedRegionId] = useState("");
  const [savedId, setSavedId] = useState("");
  const savedRegions = manifest.data?.regions.filter((item) => item.observations.length > 0) ?? [];
  const savedRegion = savedRegions.find((item) => item.id === savedRegionId) ?? savedRegions[0];
  const savedObservation = savedRegion?.observations.find((item) => item.observation.id === savedId) ?? savedRegion?.observations[0];
  const observations = query.data?.observations ?? [];
  const selected = observations.find((item) => item.id === selectedId) ?? observations[0] ?? null;

  return (
    <div className="page-shell page-width">
      <header className="page-heading">
        <div>
          <p className="eyebrow">ALL-SKY ARCHIVE EXPLORER</p>
          <h1>Explore real observations</h1>
          <p>{staticOnly ? "Explore saved NASA/IPAC FITS cutouts and their observation metadata." : "Search NASA/IPAC SIA2 by coordinates, release, and detector. Preview only a small FITS cutout around the selected position."}</p>
        </div>
        <a className="button button-secondary" href="https://irsa.ipac.caltech.edu/applications/spherex" target="_blank" rel="noreferrer">
          <Database size={16} /> Open IRSA Data Explorer <ArrowRight size={15} />
        </a>
      </header>

      {!staticOnly && <ArchiveSearchForm />}

      {manifest.isPending && <p className="notice notice-loading" role="status">Loading saved observations…</p>}
      {manifest.isError && <p className="notice notice-error" role="alert">{manifest.error.message}</p>}
      {manifest.data && !savedObservation && <p className="notice notice-empty" role="status">No saved observations are available.</p>}
      {savedRegion && savedObservation && (
        <section className="panel saved-observations" aria-labelledby="saved-viewer-title">
          <div className="panel-heading">
            <div><p className="eyebrow">DOWNLOADED ARCHIVE CUTOUTS</p><h2 id="saved-viewer-title">Explore a saved observation</h2></div>
          </div>
          <div className="comparison-controls">
            <label className="field-control"><span>Saved region</span>
              <select value={savedRegion.id} onChange={(event) => { setSavedRegionId(event.target.value); setSavedId(""); }}>
                {savedRegions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="field-control"><span>Saved observation</span>
              <select value={savedObservation.observation.id} onChange={(event) => setSavedId(event.target.value)}>
                {savedRegion.observations.map((item) => <option key={item.observation.id} value={item.observation.id}>
                  {item.observation.release} · D{item.observation.detector} · {formatObservationTime(item.observation.observation_time_utc)}
                </option>)}
              </select>
            </label>
          </div>
          <FitsViewer observation={savedObservation.observation} ra={savedRegion.ra_deg} dec={savedRegion.dec_deg}
            savedImageUrl={publicAsset(`observations/${encodeURIComponent(savedObservation.image_file)}`)} />
          <ObservationDetails observation={savedObservation.observation} />
          <p>{savedObservation.wavelength_note}</p>
          {Boolean(savedRegion.comparisons?.length) && <Link className="button button-secondary" to={`/compare?region=${encodeURIComponent(savedRegion.id)}`}>Compare this saved region <ArrowRight size={15} /></Link>}
        </section>
      )}
      {manifest.data && (
        <section className="panel saved-observations" aria-labelledby="saved-observations-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">DOWNLOADED ARCHIVE CUTOUTS</p>
              <h2 id="saved-observations-title">Saved observations</h2>
            </div>
          </div>
          <div className="saved-observation-list">
            {manifest.data.regions.flatMap((region) => region.observations.map((item) => (
              <article className="saved-observation" key={`${region.id}-${item.observation.id}`}>
                <img src={publicAsset(`observations/${encodeURIComponent(item.image_file)}`)} loading="lazy" alt={`SPHEREx ${item.observation.release} detector ${item.observation.detector} cutout`} />
                <div>
                  <strong>{region.label} · D{item.observation.detector} · {item.observation.release}</strong>
                  <p>{formatObservationTime(item.observation.observation_time_utc)}</p>
                  <p>Detector range: {formatWavelengthRange(item.observation.wavelength_min_microns, item.observation.wavelength_max_microns)}</p>
                  <p>{item.wavelength_note}</p>
                  <a className="text-link" href={item.observation.access_url} target="_blank" rel="noreferrer">Original NASA/IPAC FITS source <ArrowRight size={14} /></a>
                </div>
              </article>
            )))}
          </div>
        </section>
      )}
      {!staticOnly && <QueryFeedback query={query} />}
      {query.data && observations.length > 0 && (
        <div className="result-summary" role="status">
          <span><span className="status-dot" /> {query.data.count} archive {query.data.count === 1 ? "observation" : "observations"}</span>
          <span><MapPin size={14} /> {search.ra.toFixed(5)}°, {search.dec.toFixed(5)}°</span>
          {query.data.truncated && <span className="muted">Result list capped; increase specificity to narrow the search.</span>}
        </div>
      )}

      {observations.length > 0 && (
        <div className="explorer-layout explorer-page-layout">
          <section className="observation-panel panel" aria-labelledby="observation-list-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">AVAILABLE PRODUCTS</p>
                <h2 id="observation-list-title">Select an observation</h2>
              </div>
              <span className="count-badge">{observations.length}</span>
            </div>
            <label className="select-label" htmlFor="observation-select">Observation and actual UTC time</label>
            <select
              id="observation-select"
              className="input-select"
              value={selected?.id ?? ""}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {observations.map((observation) => (
                <option key={observation.id} value={observation.id}>
                  {formatObservationTime(observation.observation_time_utc)} · D{observation.detector} · {observation.observation_id}
                </option>
              ))}
            </select>

            <div className="observation-list" role="list" aria-label="Matching SPHEREx observations">
              {observations.slice(0, 24).map((observation) => (
                <div role="listitem" key={observation.id}>
                <button
                  type="button"
                  className={`observation-row${selected?.id === observation.id ? " selected" : ""}`}
                  onClick={() => setSelectedId(observation.id)}
                  aria-pressed={selected?.id === observation.id}
                >
                  <span className="observation-marker" aria-hidden="true" />
                  <span className="observation-row-copy">
                    <strong>{observation.observation_id}</strong>
                    <span>{formatObservationTime(observation.observation_time_utc)}</span>
                  </span>
                  <span className="observation-detector">D{observation.detector}<small>{formatWavelengthRange(observation.wavelength_min_microns, observation.wavelength_max_microns)}</small></span>
                </button>
                </div>
              ))}
              {observations.length > 24 && <p className="list-limit">Showing the first 24 of {observations.length} results. Use the selector above to access all returned records.</p>}
            </div>

            <button
              className="button button-quiet reset-search"
              type="button"
              onClick={() => {
                const currentSearch = useExplorerStore.getState().search;
                useExplorerStore.getState().setSearch({ ...currentSearch, detector: undefined });
              }}
            >
              <RotateCcw size={14} /> Clear detector filter
            </button>
          </section>

          <section className="preview-column" aria-label="Selected observation preview">
            <FitsViewer observation={selected} ra={search.ra} dec={search.dec} />
            {selected && <ObservationDetails observation={selected} />}
          </section>
        </div>
      )}

      <p className="provenance-line">
        Source: <a href="https://irsa.ipac.caltech.edu/Missions/spherex.html" target="_blank" rel="noreferrer">NASA/IPAC Infrared Science Archive</a>
        <span aria-hidden="true"> · </span>
        <a href="https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/" target="_blank" rel="noreferrer">SIA2 access documentation</a>
      </p>
    </div>
  );
}
