import { useMutation } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Search, Star } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resolveCatalogObject } from "../lib/api";
import { staticOnly } from "../lib/deployment";
import { useExplorerStore } from "../store/useExplorerStore";
import type { ResolvedObject } from "../types";

export function ObjectsPage() {
  const [name, setName] = useState("");
  const [objects, setObjects] = useState<ResolvedObject[]>([]);
  const [selectedName, setSelectedName] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [listFilter, setListFilter] = useState("");
  const search = useExplorerStore((state) => state.search);
  const setSearch = useExplorerStore((state) => state.setSearch);
  const navigate = useNavigate();
  const lookup = useMutation({ mutationFn: (query: string) => resolveCatalogObject(query) });
  const types = [...new Set(objects.map((item) => item.object_type).filter((value): value is string => Boolean(value)))].sort();
  const matchingObjects = objects.filter((item) =>
    (!typeFilter || item.object_type === typeFilter)
    && item.name.toLowerCase().includes(listFilter.trim().toLowerCase()),
  );
  const resolved = matchingObjects.find((item) => item.name === selectedName) ?? matchingObjects[0] ?? null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    lookup.mutate(name.trim(), {
      onSuccess: (item) => {
        setObjects((current) => [...current.filter((entry) => entry.name !== item.name), item]);
        setSelectedName(item.name);
        setTypeFilter("");
        setListFilter("");
      },
    });
  }

  function exploreObject() {
    if (!resolved) return;
    setSearch({ ...search, ra: resolved.ra_deg, dec: resolved.dec_deg, radius: 0.01 });
    navigate("/explore");
  }

  return (
    <div className="page-shell page-width">
      <header className="page-heading">
        <div>
          <p className="eyebrow">CATALOG NAME RESOLUTION</p>
          <h1>Find a known object</h1>
          <p>{staticOnly ? "Live SIMBAD name resolution requires the separately hosted API." : "Resolve a name with SIMBAD, verify its returned coordinates, then search SPHEREx around that position."}</p>
        </div>
        <a className="status-chip" href="https://simbad.cds.unistra.fr/" target="_blank" rel="noreferrer">
          <Star size={15} /> SIMBAD catalog
        </a>
      </header>

      {!staticOnly && <form className="object-search panel" onSubmit={submit}>
        <label className="field-control object-name-field">
          <span>Catalog object name</span>
          <input
            type="search"
            autoComplete="off"
            maxLength={80}
            placeholder="Try a catalog identifier, e.g. M31"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <button className="button button-primary" type="submit" disabled={lookup.isPending}>
          <Search size={16} /> {lookup.isPending ? "Resolving…" : "Resolve name"}
        </button>
      </form>}

      <p className="form-note">Suggested challenge targets: Barnard's Star, Epsilon Indi B, WISE J085510.83-071442.5, RW Aurigae and R Draconis. Names must be resolved by SIMBAD; coordinates may change with the epoch of a moving object.</p>
      {lookup.isPending && <p className="notice notice-loading" role="status">Resolving the object with SIMBAD…</p>}
      {lookup.isError && <p className="notice notice-error" role="alert">{lookup.error.message}</p>}
      {objects.length > 0 && (
        <section className="panel saved-observations" aria-labelledby="resolved-list-title">
          <div className="panel-heading"><h2 id="resolved-list-title">Objects resolved this session</h2></div>
          <div className="comparison-controls">
            <label className="field-control"><span>Filter resolved names</span>
              <input type="search" value={listFilter} onChange={(event) => setListFilter(event.target.value)} />
            </label>
            <label className="field-control"><span>SIMBAD type code</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="">All resolved types</option>
                {types.map((type) => <option value={type} key={type}>{type}</option>)}
              </select>
            </label>
          </div>
          {matchingObjects.length > 0 ? (
            <div className="resolved-list" aria-label="Matching resolved objects">
              {matchingObjects.map((item) => (
                <button key={item.name} className="button button-secondary" type="button" aria-pressed={resolved?.name === item.name}
                  onClick={() => setSelectedName(item.name)}>{item.name} · {item.object_type ?? "type unavailable"}</button>
              ))}
            </div>
          ) : <p role="status">No resolved objects match these filters.</p>}
          <p className="form-note">This list contains only names resolved during this visit, not a complete object catalog.</p>
        </section>
      )}
      {resolved && (
        <section className="resolved-object panel" aria-labelledby="resolved-title">
          <div className="resolved-object-icon"><Star size={23} /></div>
          <div className="resolved-object-copy">
            <p className="eyebrow">SIMBAD-RESOLVED OBJECT</p>
            <h2 id="resolved-title">{resolved.name}</h2>
            <p>{resolved.object_type ? `SIMBAD classification: ${resolved.object_type}` : "SIMBAD returned no classification."}</p>
            <dl className="object-coordinates">
              <div><dt>Right ascension</dt><dd>{resolved.ra_deg.toFixed(7)}°</dd></div>
              <div><dt>Declination</dt><dd>{resolved.dec_deg.toFixed(7)}°</dd></div>
              <div><dt>Catalog</dt><dd>{resolved.catalog}</dd></div>
            </dl>
            <div className="hero-actions">
              <button className="button button-primary" type="button" onClick={exploreObject}>
                Search SPHEREx here <ArrowRight size={16} />
              </button>
              <a className="button button-secondary" href={resolved.catalog_url} target="_blank" rel="noreferrer">
                Verify catalog record <BookOpen size={15} />
              </a>
            </div>
            <p>Object-specific comparison is unavailable until a compatible, aligned pair is prepared for this position.</p>
          </div>
        </section>
      )}

      {!staticOnly && objects.length === 0 && !lookup.isPending && !lookup.isError && (
        <div className="education-card">
          <div className="feature-icon"><Search size={19} /></div>
          <h2>Verified names, not invented targets</h2>
          <p>The resolver returns a catalog name, coordinate, and type code directly from SIMBAD. This tool does not manufacture catalog entries or claim that a source is detected in SPHEREx.</p>
          <Link className="text-link" to="/about">How to interpret results <ArrowRight size={15} /></Link>
        </div>
      )}

      <p className="provenance-line">
        Names and coordinates: <a href="https://simbad.cds.unistra.fr/" target="_blank" rel="noreferrer">SIMBAD, CDS</a>.
        SPHEREx coverage is verified separately through the <a href="https://irsa.ipac.caltech.edu/Missions/spherex.html" target="_blank" rel="noreferrer">NASA/IPAC IRSA archive</a>.
      </p>
    </div>
  );
}
