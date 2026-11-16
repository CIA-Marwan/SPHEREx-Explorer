import { useEffect, useRef, useState } from "react";
import OpenSeadragon from "openseadragon";
import { Maximize, Minus, Plus, RotateCcw } from "lucide-react";
import { previewUrl } from "../lib/api";
import type { Observation } from "../types";

export function FitsViewer({
  observation,
  ra,
  dec,
  size = 0.1,
  savedImageUrl,
}: {
  observation: Observation | null;
  ra: number;
  dec: number;
  size?: number;
  savedImageUrl?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<OpenSeadragon.Viewer | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const imageUrl = observation ? savedImageUrl ?? previewUrl(observation.access_url, ra, dec, size) : "";

  useEffect(() => {
    if (!hostRef.current || !imageUrl) return;
    setError("");
    setLoading(true);
    const viewer = OpenSeadragon({
      element: hostRef.current,
      tileSources: { type: "image", url: imageUrl },
      showNavigationControl: false,
      showSequenceControl: false,
      showHomeControl: false,
      showFullPageControl: false,
      showZoomControl: false,
      visibilityRatio: 0.85,
      minZoomLevel: 0.6,
      maxZoomPixelRatio: 6,
      animationTime: 0.2,
      gestureSettingsMouse: {
        clickToZoom: false,
        dblClickToZoom: true,
        dragToPan: true,
        scrollToZoom: true,
      },
    });
    viewerRef.current = viewer;
    viewer.addHandler("open", () => setLoading(false));
    viewer.addHandler("open-failed", (event) => {
      setLoading(false);
      setError(event.message || "The FITS cutout could not be displayed.");
    });

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [imageUrl]);

  if (!observation) {
    return <div className="viewer-empty">Select an archive observation to load its cutout.</div>;
  }

  return (
    <div className="viewer-shell">
      <div className="viewer-toolbar" aria-label="Image controls">
        <span className="viewer-hint">Scroll to zoom · Drag to pan</span>
        <div className="viewer-buttons">
          <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => viewerRef.current?.viewport.zoomBy(1.5)}>
            <Plus size={16} />
          </button>
          <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => viewerRef.current?.viewport.zoomBy(1 / 1.5)}>
            <Minus size={16} />
          </button>
          <button type="button" aria-label="Reset image view" title="Reset image view" onClick={() => viewerRef.current?.viewport.goHome()}>
            <RotateCcw size={15} />
          </button>
          <button type="button" aria-label="View image fullscreen" title="View image fullscreen" onClick={() => viewerRef.current?.setFullScreen(true)}>
            <Maximize size={15} />
          </button>
        </div>
      </div>
      <div
        className="fits-viewer"
        ref={hostRef}
        role="img"
        aria-label={`SPHEREx detector ${observation.detector} science image cutout`}
      />
      {loading && !error && <p className="viewer-overlay" role="status">{savedImageUrl ? "Loading saved observation…" : "Loading a bounded FITS cutout from IRSA…"}</p>}
      {error && <p className="viewer-overlay viewer-error" role="alert">{error}</p>}
      <div className="comparison-pan-controls" aria-label="Pan image">
        <span>Pan image:</span>
        {([["Left", -1, 0], ["Right", 1, 0], ["Up", 0, -1], ["Down", 0, 1]] as const).map(([label, x, y]) => (
          <button key={label} className="button button-quiet" type="button" onClick={() => {
            const viewport = viewerRef.current?.viewport;
            if (viewport) {
              const bounds = viewport.getBounds();
              viewport.panBy(new OpenSeadragon.Point(x * bounds.width * 0.15, y * bounds.height * 0.15));
            }
          }}>{label}</button>
        ))}
      </div>
      <p className="viewer-caption">
        Processed display of the real IMAGE extension in MJy/sr. Asinh percentile stretch is for viewing only; it is not photometric analysis.
      </p>
    </div>
  );
}
