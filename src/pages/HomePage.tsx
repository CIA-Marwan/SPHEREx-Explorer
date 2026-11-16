import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  CircleDot,
  Compass,
  Layers2,
  Radio,
  Search,
  Telescope,
} from "lucide-react";
import { Link } from "react-router-dom";
import { staticOnly } from "../lib/deployment";

const cards = [
  {
    icon: Compass,
    title: "Explore a region",
    description: staticOnly ? "Inspect saved DR1 and QR3 observations from the public archive." : "Search the public archive by sky coordinates and inspect actual DR1 or QR3 observations.",
    to: "/explore",
    tag: staticOnly ? "SAVED ARCHIVE DATA" : "LIVE SIA2 SEARCH",
  },
  {
    icon: Layers2,
    title: "Compare observations",
    description: "Inspect wavelength-screened, WCS-aligned archive observations at their recorded times.",
    to: "/compare",
    tag: "ARCHIVE-BASED",
  },
  {
    icon: Search,
    title: "Find a known object",
    description: staticOnly ? "Learn about SIMBAD name resolution, available with a separate API." : "Resolve a catalog name with SIMBAD, then search SPHEREx around its verified coordinates.",
    to: "/objects",
    tag: "SIMBAD + SPHEREx",
  },
  {
    icon: CalendarDays,
    title: "Follow the timeline",
    description: staticOnly ? "Review the timeline limitations and open the saved comparison." : "Step through real archive timestamps and inspect individual observations.",
    to: "/timeline",
    tag: "REAL TIMESTAMPS",
  },
];

export function HomePage() {
  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-inner page-width">
          <div className="home-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> THE UNIVERSE IN 102 SPECTRAL CHANNELS</p>
            <h1 id="home-title">Explore the<br /><span className="gradient-text">Changing Infrared Sky</span></h1>
            <p className="hero-subtitle">
              Discover the universe through real SPHEREx observations. Explore astronomical regions and investigate archive records across time.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/explore">
                <Compass size={17} aria-hidden="true" /> Explore the sky <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a className="button button-glass" href="#workflow-title" onClick={(event) => {
                if (staticOnly) {
                  event.preventDefault();
                  document.getElementById("workflow-title")?.scrollIntoView();
                }
              }}>
                <CircleDot size={16} aria-hidden="true" /> How it works
              </a>
            </div>
            <div className="hero-footnote">
              <span className="live-pulse" aria-hidden="true" />
              Public NASA/IPAC archive data · no account required
            </div>
          </div>

          <div className="hero-facts" aria-label="SPHEREx mission facts">
            <div className="hero-fact">
              <span className="fact-icon"><Radio size={18} /></span>
              <div><strong>102 spectral channels</strong><span>Near-infrared observations</span></div>
            </div>
            <div className="hero-fact">
              <span className="fact-icon"><Telescope size={18} /></span>
              <div><strong>0.75–5.0 μm</strong><span>Across six detectors</span></div>
            </div>
            <div className="hero-fact">
              <span className="fact-icon"><CalendarDays size={18} /></span>
              <div><strong>Repeated all-sky survey</strong><span>Compare only archive timestamps</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section page-width" aria-labelledby="workflow-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A CLEAR PATH THROUGH THE ARCHIVE</p>
            <h2 id="workflow-title">From a sky position to a real observation</h2>
          </div>
          <Link className="text-link" to="/explore">Open the explorer <ArrowRight size={16} /></Link>
        </div>
        <div className="feature-grid-home">
          {cards.map(({ icon: Icon, title, description, to, tag }, index) => (
            <Link className="feature-card-home" to={to} key={title}>
              <div className="feature-card-top">
                <span className="feature-icon"><Icon size={20} aria-hidden="true" /></span>
                <span className="feature-index">0{index + 1}</span>
              </div>
              <span className="feature-tag">{tag}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="feature-card-link">Open tool <ArrowDownRight size={16} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-note page-width" aria-label="Data and interpretation note">
        <div className="note-symbol"><Radio size={18} /></div>
        <div>
          <strong>Science first, with clear limits.</strong>
          <p>Observations come from IRSA. Comparisons use wavelength screening and WCS alignment for visual inspection, not discovery or photometric analysis. The hero artwork is AI-generated and is not SPHEREx science data.</p>
        </div>
        <Link to="/about" className="text-link">Read the limitations <ArrowRight size={15} /></Link>
      </section>
    </>
  );
}
