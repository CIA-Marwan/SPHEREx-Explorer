import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { AlertTriangle, ArrowLeftRight, Minus, Plus, RotateCcw } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { ObservationDetails } from "../components/ObservationDetails";
import { useObservationManifest, type SavedComparison } from "../hooks/useObservationManifest";
import { formatElapsedDays, formatObservationTime } from "../lib/science";
import { publicAsset } from "../lib/deployment";

function ComparisonViewer({ pair }: { pair: SavedComparison }) {
  const [split, setSplit] = useState(50);
  const [mode, setMode] = useState<"slider" | "side" | "blink">("slider");
  const [laterFrame, setLaterFrame] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(0);
  const [error, setError] = useState(false);
  const dragging = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const canvas = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mode !== "blink") return;
    const timer = window.setInterval(() => setLaterFrame((current) => !current), 1200);
    return () => window.clearInterval(timer);
  }, [mode]);
  const transform = { transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` };
  const image = (name: string, label: string) => (
    <img
      className="comparison-image"
      style={transform}
      src={publicAsset(`observations/${encodeURIComponent(name)}`)}
      alt={label}
      draggable={false}
      onLoad={() => setLoaded((count) => count + 1)}
      onError={() => setError(true)}
    />
  );
  const reset = () => {
    setSplit(50);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setMode("slider");
    setLaterFrame(false);
  };
  const startPan = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragging.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const movePan = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setPan({
      x: dragging.current.panX + event.clientX - dragging.current.x,
      y: dragging.current.panY + event.clientY - dragging.current.y,
    });
  };
  const moveDivider = (event: PointerEvent<HTMLButtonElement>) => {
    const bounds = canvas.current?.getBoundingClientRect();
    if (bounds) setSplit(Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100)));
  };
  const before = `Earlier observation, ${formatObservationTime(pair.earlier.observation_time_utc)}`;
  const after = `Later observation, ${formatObservationTime(pair.later.observation_time_utc)}`;

  return (
    <section className="comparison-viewer" aria-label="Aligned comparison viewer">
      <div className="comparison-tools">
        <button className="button button-secondary" type="button" aria-pressed={mode === "slider"} onClick={() => setMode("slider")}>Before / after</button>
        <button className="button button-secondary" type="button" aria-pressed={mode === "side"} onClick={() => setMode("side")}>Side by side</button>
        <button className="button button-secondary" type="button" aria-pressed={mode === "blink"} onClick={() => {
          setLaterFrame(false);
          setMode((current) => current === "blink" ? "slider" : "blink");
        }}>{mode === "blink" ? "Stop blinking" : "Blink images"}</button>
        <button className="icon-button" type="button" aria-label="Zoom in both images" onClick={() => setZoom((z) => Math.min(5, z * 1.4))}><Plus size={16} /></button>
        <button className="icon-button" type="button" aria-label="Zoom out both images" onClick={() => setZoom((z) => Math.max(1, z / 1.4))}><Minus size={16} /></button>
        <button className="button button-secondary" type="button" onClick={reset}><RotateCcw size={15} /> Reset comparison</button>
      </div>
      <div className="comparison-pan-controls" aria-label="Pan both images">
        <span>Pan both images:</span>
        {([["Left", -30, 0], ["Right", 30, 0], ["Up", 0, -30], ["Down", 0, 30]] as const).map(([label, dx, dy]) => (
          <button key={label} className="button button-quiet" type="button" onClick={() => setPan((p) => ({ x: p.x + dx, y: p.y + dy }))}>{label}</button>
        ))}
        <span>Zoom {zoom.toFixed(1)}× · drag images to pan</span>
      </div>
      {error && <p className="notice notice-error" role="alert">An aligned image could not be loaded. Rebuild the comparison or check the deployment files.</p>}
      {!error && loaded < 2 && <p className="notice notice-loading" role="status">Loading aligned observation images…</p>}
      <div
        className={`comparison-canvas${mode === "side" ? " comparison-side" : ""}`}
        ref={canvas}
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={() => { dragging.current = null; }}
        onPointerCancel={() => { dragging.current = null; }}
      >
        {mode === "slider" ? (
          <>
            <div className="comparison-layer">{image(pair.before_image, before)}</div>
            <div className="comparison-layer" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>{image(pair.after_image, after)}</div>
            <span className="comparison-label comparison-label-before">Earlier</span>
            <span className="comparison-label comparison-label-after">Later</span>
            <button
              type="button"
              className="comparison-divider-handle"
              style={{ left: `${split}%` } as CSSProperties}
              aria-label="Drag comparison divider; use the slider below for keyboard control"
              onPointerDown={(event) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); moveDivider(event); }}
              onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) moveDivider(event); }}
            ><span aria-hidden="true">↔</span></button>
          </>
        ) : mode === "side" ? (
          <>
            <div className="comparison-side-panel">{image(pair.before_image, before)}<span className="comparison-label comparison-label-before">Earlier</span></div>
            <div className="comparison-side-panel">{image(pair.after_image, after)}<span className="comparison-label comparison-label-after">Later</span></div>
          </>
        ) : (
          <div className="comparison-layer">
            {image(laterFrame ? pair.after_image : pair.before_image, laterFrame ? after : before)}
            <span className="comparison-label comparison-label-before">{laterFrame ? "Later" : "Earlier"}</span>
          </div>
        )}
      </div>
      {mode === "slider" && (
        <label className="comparison-range">
          <span>Earlier</span>
          <input type="range" min="0" max="100" value={split} aria-label="Before and after divider position" onChange={(event) => setSplit(Number(event.target.value))} />
          <span>Later</span>
        </label>
      )}
      <p className="viewer-caption">Both images use the same WCS grid, valid-pixel mask and display scale. Drag to pan; controls affect both images. Images are for visual inspection, not photometry.</p>
    </section>
  );
}

export function ComparePage() {
  const manifest = useObservationManifest();
  const [params, setParams] = useSearchParams();
  const regionId = params.get("region") ?? "";
  const [pairId, setPairId] = useState("");
  const regions = manifest.data?.regions.filter((item) => item.comparisons?.length) ?? [];
  const region = regionId ? regions.find((item) => item.id === regionId) : regions[0];
  const pairs = region?.comparisons ?? [];
  const pair = pairs.find((item) => item.id === pairId) ?? pairs[0];

  return (
    <div className="page-shell page-width">
      <header className="page-heading">
        <div>
          <p className="eyebrow">VISUAL TEMPORAL COMPARISON</p>
          <h1>Compare real observations</h1>
          <p>Inspect preprocessed, wavelength-screened archive images on a common WCS grid.</p>
        </div>
        <span className="status-chip"><ArrowLeftRight size={15} /> Archive observations</span>
      </header>
      {manifest.isPending && <p className="notice notice-loading" role="status">Loading the observation manifest…</p>}
      {manifest.isError && <p className="notice notice-error" role="alert">{manifest.error.message}</p>}
      {manifest.data && !pair && <div className="notice notice-empty" role="status"><span>No screened comparison pair is available for this region. Build a pair using the documented calibration pipeline; arbitrary archive records cannot be compared safely.</span>{regionId && <Link className="text-link" to="/compare">View available comparisons</Link>}</div>}
      {pair && region && (
        <>
          <div className="comparison-controls panel">
            <label className="field-control"><span>Region</span>
              <select value={region.id} disabled={regions.length === 1} onChange={(event) => { setParams({ region: event.target.value }); setPairId(""); }}>
                {regions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="field-control"><span>Earlier observation</span>
              <select value={pair.id} disabled={pairs.length === 1} onChange={(event) => setPairId(event.target.value)}>
                {pairs.map((item) => <option key={item.id} value={item.id}>{formatObservationTime(item.earlier.observation_time_utc)} · {item.earlier.observation_id}</option>)}
              </select>
            </label>
            <label className="field-control"><span>Later observation</span>
              <select value={pair.id} disabled={pairs.length === 1} onChange={(event) => setPairId(event.target.value)}>
                {pairs.map((item) => <option key={item.id} value={item.id}>{formatObservationTime(item.later.observation_time_utc)} · {item.later.observation_id}</option>)}
              </select>
            </label>
          </div>
          <p className="viewer-caption">{pairs.length === 1 ? "Only one screened pair is available for this region; its dates cannot be changed." : "Choose either date to select its screened pair; the other date updates with it."}</p>
          <p className="result-summary">
            {region.label} · D{pair.earlier.detector} · central wavelength {pair.details.central_wavelength_microns.toFixed(4)} µm · bandwidth {pair.details.central_bandwidth_microns.toFixed(4)} µm · {pair.details.valid_pixels}/{pair.details.total_pixels} valid aligned pixels
          </p>
          <div className="comparison-timeline" aria-label="Observation timeline">
            <span>{formatObservationTime(pair.earlier.observation_time_utc)}</span>
            <span>→ {formatElapsedDays(pair.later.observation_mjd - pair.earlier.observation_mjd)} →</span>
            <span>{formatObservationTime(pair.later.observation_time_utc)}</span>
          </div>
          <ComparisonViewer key={pair.id} pair={pair} />
          <div className="comparison-metadata">
            <ObservationDetails observation={pair.earlier} />
            <ObservationDetails observation={pair.later} />
          </div>
          <p className="notice notice-caution"><AlertTriangle size={17} /> The same nearest-neighbor pixel supplies both intensity and wavelength screening; wavelengths and bandwidths differ by at most 10% of the narrower bandwidth. Reprojection uses archive WCS and has not been independently registered against stars. Resampling can introduce pixel-level artifacts. {pair.limitations} Apparent differences may be observational or processing effects, not discoveries.</p>
          <p className="provenance-line">{pair.method} · <a href={pair.calibration_url} target="_blank" rel="noreferrer">NASA/IPAC spectral calibration</a></p>
          <p className="notice notice-empty" role="status">Scientific difference image unavailable: PSF matching and reliable uncertainty propagation have not been implemented.</p>
        </>
      )}
    </div>
  );
}
