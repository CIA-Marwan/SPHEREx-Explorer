import { useMemo, useState } from "react";
import {
  Activity,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArchiveSearchForm } from "../components/ArchiveSearchForm";
import { FitsViewer } from "../components/FitsViewer";
import { ObservationDetails } from "../components/ObservationDetails";
import { QueryFeedback } from "../components/QueryFeedback";
import { useObservations } from "../hooks/useObservations";
import { formatObservationTime } from "../lib/science";
import { staticOnly } from "../lib/deployment";

export function TimelinePage() {
  const { search, query } = useObservations();
  const observations = useMemo(
    () => [...(query.data?.observations ?? [])].sort((a, b) => a.observation_mjd - b.observation_mjd),
    [query.data?.observations],
  );
  const [selectedId, setSelectedId] = useState("");
  const selectedIndex = Math.max(0, observations.findIndex((item) => item.id === selectedId));
  const selected = observations[selectedIndex] ?? null;

  function moveTo(index: number) {
    const target = observations[Math.max(0, Math.min(index, observations.length - 1))];
    if (target) setSelectedId(target.id);
  }

  const chartData = observations.map((item, index) => ({
    observation_mjd: item.observation_mjd,
    detector: item.detector,
    id: item.id,
    sequence: index + 1,
  }));

  return (
    <div className="page-shell page-width">
      <header className="page-heading">
        <div>
          <p className="eyebrow">OBSERVATION HISTORY</p>
          <h1>Follow the archive timeline</h1>
          <p>Explore actual observation timestamps returned by NASA/IPAC. Individual previews are not aligned comparisons.</p>
        </div>
        <span className="status-chip"><Activity size={15} /> No interpolated frames</span>
      </header>

      {!staticOnly && <ArchiveSearchForm compact />}
      {!staticOnly && <QueryFeedback query={query} />}
      {staticOnly && <p className="notice notice-empty" role="status">The live archive timeline requires a separate API. The saved comparison includes its real observation dates.</p>}
      <p className="notice notice-caution">These archive records may have different wavelengths, positions and display stretches. Automatic playback is unavailable here because the images have not been aligned and screened. <Link className="text-link" to="/compare">Open the screened comparison</Link> to blink the available pair.</p>

      {observations.length > 0 && (
        <>
          <section className="timeline-chart panel" aria-labelledby="timeline-chart-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">ARCHIVE TIMES</p>
                <h2 id="timeline-chart-title">{observations.length} available records</h2>
              </div>
              <span className="source-chip">Horizontal axis: Modified Julian Date (UTC)</span>
            </div>
            <div className="chart-wrap" role="img" aria-label="Scatter plot of returned observations by MJD and detector">
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
                  <CartesianGrid stroke="rgba(113, 140, 202, .13)" vertical={false} />
                  <XAxis
                    dataKey="observation_mjd"
                    type="number"
                    name="MJD (UTC)"
                    domain={["dataMin", "dataMax"]}
                    tick={{ fill: "#91a1c4", fontSize: 11 }}
                    axisLine={{ stroke: "#25385f" }}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="detector"
                    type="number"
                    name="Detector"
                    domain={[1, 6]}
                    ticks={[1, 2, 3, 4, 5, 6]}
                    tickFormatter={(value: number) => `D${value}`}
                    tick={{ fill: "#91a1c4", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "4 4" }}
                    formatter={(value, name) => [String(value), String(name)]}
                    labelFormatter={(value) => `Archive MJD ${Number(value).toFixed(6)}`}
                    contentStyle={{
                      background: "#0a1329",
                      border: "1px solid #314777",
                      borderRadius: 10,
                      color: "#eff3ff",
                    }}
                  />
                  <Scatter
                    name="Actual archive exposures"
                    data={chartData}
                    fill="#8f63ff"
                    onClick={(point) => {
                      const id = point?.payload?.id;
                      if (typeof id === "string") setSelectedId(id);
                    }}
                    cursor="pointer"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="chart-caption">Select a point or use the controls below to step through the records in chronological order.</p>
          </section>

          <section className="timeline-controls panel" aria-label="Timeline playback controls">
            <div className="timeline-control-buttons">
              <button className="icon-button" type="button" aria-label="Reset to first observation" onClick={() => moveTo(0)}>
                <RotateCcw size={16} />
              </button>
              <button className="icon-button" type="button" aria-label="Previous observation" onClick={() => moveTo(selectedIndex - 1)}>
                <SkipBack size={16} />
              </button>
              <button className="icon-button" type="button" aria-label="Next observation" onClick={() => moveTo(selectedIndex + 1)}>
                <SkipForward size={16} />
              </button>
            </div>
            <label className="timeline-scrubber">
              <span className="sr-only">Choose an actual archive observation</span>
              <input
                type="range"
                min="0"
                max={observations.length - 1}
                value={selectedIndex}
                onChange={(event) => moveTo(Number(event.target.value))}
              />
              <span>{selectedIndex + 1} / {observations.length}</span>
            </label>
          </section>

          <div className="timeline-current">
            <div className="timeline-current-heading">
              <p className="eyebrow">SELECTED ARCHIVE FRAME</p>
              {selected && <h2>{formatObservationTime(selected.observation_time_utc)}</h2>}
            </div>
            {selected && (
              <div className="explorer-layout">
                <FitsViewer observation={selected} ra={search.ra} dec={search.dec} />
                <ObservationDetails observation={selected} />
              </div>
            )}
          </div>
        </>
      )}
      <p className="provenance-line">Timestamps originate in SIA2 `t_min` metadata and are converted from MJD using Astropy Time (UTC).</p>
    </div>
  );
}
