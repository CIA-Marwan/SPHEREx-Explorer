import { useEffect, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { useObservationManifest } from "../hooks/useObservationManifest";
import { useExplorerStore } from "../store/useExplorerStore";
import type { Collection, SearchRequest } from "../types";

const regionPresets = {
  documentation: { label: "IRSA example field", ra: 127.69444, dec: -39.1776 },
  andromeda: { label: "Andromeda (M31)", ra: 10.6847083, dec: 41.26875 },
  galacticCenter: { label: "Galactic center", ra: 266.4051, dec: -28.936175 },
  custom: { label: "Custom coordinates", ra: 127.69444, dec: -39.1776 },
} as const;

type Preset = keyof typeof regionPresets;

export function ArchiveSearchForm({ compact = false }: { compact?: boolean }) {
  const manifest = useObservationManifest();
  const search = useExplorerStore((state) => state.search);
  const setSearch = useExplorerStore((state) => state.setSearch);
  const [draft, setDraft] = useState<SearchRequest>(search);
  const [preset, setPreset] = useState<string>("documentation");
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(search);
    const matchingPreset = Object.entries(regionPresets).find(
      ([key, region]) =>
        key !== "custom" && region.ra === search.ra && region.dec === search.dec,
    )?.[0] as Preset | undefined;
    setPreset(matchingPreset ?? "custom");
  }, [search]);

  function update<K extends keyof SearchRequest>(key: K, value: SearchRequest[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key === "ra" || key === "dec") setPreset("custom");
  }

  function chooseRegion(value: string) {
    setPreset(value);
    const savedRegion = manifest.data?.regions.find((region) => `saved:${region.id}` === value);
    if (savedRegion) {
      setDraft((current) => ({ ...current, ra: savedRegion.ra_deg, dec: savedRegion.dec_deg }));
    } else if (value !== "custom" && value in regionPresets) {
      const region = regionPresets[value as Preset];
      setDraft((current) => ({ ...current, ra: region.ra, dec: region.dec }));
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isFinite(draft.ra) || draft.ra < 0 || draft.ra >= 360) {
      setError("Right ascension must be between 0° and 360°.");
      return;
    }
    if (!Number.isFinite(draft.dec) || draft.dec < -90 || draft.dec > 90) {
      setError("Declination must be between −90° and +90°.");
      return;
    }
    setError("");
    setSearch({ ...draft });
  }

  return (
    <form className={`search-panel${compact ? " compact" : ""}`} onSubmit={submit}>
      <div className="search-panel-heading">
        <div>
          <p className="eyebrow">NASA/IPAC ARCHIVE SEARCH</p>
          <h2>Choose a sky position</h2>
        </div>
        <span className="source-chip"><span className="status-dot" /> Live archive</span>
      </div>

      <div className="search-fields">
        <label className="field-control">
          <span>Region preset</span>
          <select value={preset} onChange={(event) => chooseRegion(event.target.value)}>
            {manifest.data?.regions.map((region) => (
              <option key={region.id} value={`saved:${region.id}`}>{region.label} · saved data</option>
            ))}
            {Object.entries(regionPresets).map(([key, region]) => (
              <option key={key} value={key}>{region.label}</option>
            ))}
          </select>
        </label>
        <label className="field-control">
          <span>Right ascension <small>degrees</small></span>
          <input
            type="number"
            min="0"
            max="359.999999"
            step="0.000001"
            value={draft.ra}
            onChange={(event) => update("ra", Number(event.target.value))}
            required
          />
        </label>
        <label className="field-control">
          <span>Declination <small>degrees</small></span>
          <input
            type="number"
            min="-90"
            max="90"
            step="0.000001"
            value={draft.dec}
            onChange={(event) => update("dec", Number(event.target.value))}
            required
          />
        </label>
        <label className="field-control">
          <span>Search radius</span>
          <select
            value={draft.radius}
            onChange={(event) => update("radius", Number(event.target.value))}
          >
            <option value="0.005">0.005° · focused</option>
            <option value="0.01">0.01° · default</option>
            <option value="0.03">0.03° · wider</option>
            <option value="0.1">0.1° · broad</option>
          </select>
        </label>
        <label className="field-control">
          <span>Dataset release</span>
          <select
            value={draft.collection}
            onChange={(event) => update("collection", event.target.value as Collection)}
          >
            <option value="spherex_dr1">DR1 · Wide Survey</option>
            <option value="spherex_dr1_deep">DR1 · Deep Survey</option>
            <option value="spherex_qr3">QR3 · Wide Survey</option>
            <option value="spherex_qr3_deep">QR3 · Deep Survey</option>
          </select>
        </label>
        <label className="field-control">
          <span>Spectral detector</span>
          <select
            value={draft.detector ?? ""}
            onChange={(event) => update("detector", event.target.value ? Number(event.target.value) : undefined)}
          >
            <option value="">All available</option>
            {Array.from({ length: 6 }, (_, index) => (
              <option key={index + 1} value={index + 1}>Detector {index + 1}</option>
            ))}
          </select>
        </label>
        <button className="button button-primary search-submit" type="submit">
          <Search size={16} aria-hidden="true" /> Search observations
        </button>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      {manifest.isError && <p className="field-error" role="alert">Saved regions unavailable: {manifest.error.message} Live coordinate search remains available.</p>}
      <p className="form-note">
        The initial coordinates are the example position in the IRSA SPHEREx access documentation. Search results come from SIA2; no observations are pre-filled.
      </p>
    </form>
  );
}
