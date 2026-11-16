import { BookOpen, CircleAlert, ExternalLink, Radio, Telescope } from "lucide-react";
import { staticOnly } from "../lib/deployment";

const sources = [
  {
    title: "SPHEREx Data Release 1 Spectral Images",
    detail: "The SIA2-searchable Level 2 Multi-Extension FITS science products used for coordinate searches and cutout previews.",
    url: "https://www.ipac.caltech.edu/doi/10.26131/IRSA678",
  },
  {
    title: "SPHEREx Data Release 1 All-Sky Cube",
    detail: "The DR1 spectral cube product. Consult the archive for the complete 102-channel cube and its visualization-only HiPS PNG products.",
    url: "https://www.ipac.caltech.edu/doi/10.26131/IRSA679",
  },
  {
    title: "SPHEREx Archive User Guide",
    detail: "SIA2 collection names, image products, cutout service, and archive access instructions.",
    url: "https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/",
  },
];

export function AboutPage() {
  return (
    <div className="page-shell page-width">
      <header className="page-heading">
        <div>
          <p className="eyebrow">MISSION, METHOD &amp; LIMITATIONS</p>
          <h1>Understand the infrared sky</h1>
          <p>SPHEREx observes the whole sky in many near-infrared spectral channels, helping scientists investigate cosmic history and nearby objects.</p>
        </div>
        <span className="status-chip"><Telescope size={15} /> Independent science interface</span>
      </header>

      <div className="education-grid">
        <article className="education-card">
          <span className="feature-icon"><Radio size={20} /></span>
          <h2>What does SPHEREx observe?</h2>
          <p>SPHEREx is a space-based spectral survey mission. Its archive organizes calibrated spectral images by observation and detector. {staticOnly ? "This static site displays selected saved records; live searches require an API." : "This application searches those published records."} It does not operate the spacecraft.</p>
        </article>
        <article className="education-card">
          <span className="feature-icon"><BookOpen size={20} /></span>
          <h2>Why 102 channels?</h2>
          <p>Across six detectors, the mission samples near-infrared light from approximately 0.75 to 5.0 microns. Different wavelengths carry different information about stars, galaxies, dust, and ices.</p>
        </article>
        <article className="education-card">
          <span className="feature-icon"><CircleAlert size={20} /></span>
          <h2>How to read comparisons</h2>
          <p>Choose the saved region and dates in Compare, then drag the divider, view the images side by side, or blink them. Both use a common display stretch and archive WCS. Pixel wavelengths are screened using mission calibration maps; the same detector alone does not guarantee the same wavelength.</p>
        </article>
      </div>

      <section className="limitation-card">
        <h2>Why infrared and repeated surveys?</h2>
        <p>Near-infrared light reveals features of cool objects and dust that look different in visible light. Repeated observations can help people look for changes or motion, but viewing differences alone does not establish a discovery.</p>
        <h2>Using the explorer</h2>
        <p>{staticOnly ? "Open Explore to select a saved cutout and check its date, detector range and source link. Compare offers a single prepared pair. Live archive search, Timeline records and SIMBAD resolution require a separately hosted API." : "Open Explore to select a saved cutout or search the archive by sky coordinates. Check its date, detector range and source link. Compare offers a single prepared pair; the Timeline lists individual records that have not been aligned for comparison. Objects resolves names through SIMBAD before searching the archive."}</p>
        <p>Project repository: <a href="https://github.com/CIA-Marwan/SPHEREx-Explorer" target="_blank" rel="noreferrer">SPHEREx Explorer on GitHub</a>.</p>
      </section>

      <section className="source-section">
        <div className="section-heading">
          <div><p className="eyebrow">REPRODUCIBLE SOURCES</p><h2>Trace every archive product</h2></div>
        </div>
        <div className="source-list">
          {sources.map((source) => (
            <a className="source-row" href={source.url} target="_blank" rel="noreferrer" key={source.title}>
              <span><strong>{source.title}</strong><small>{source.detail}</small></span>
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          ))}
          <a className="source-row" href="https://simbad.cds.unistra.fr/" target="_blank" rel="noreferrer">
            <span><strong>SIMBAD Astronomical Database</strong><small>External catalog name resolution for the Object Discovery workflow.</small></span>
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="limitation-card">
        <h2>Scientific limitations</h2>
        <ul>
          <li>Only metadata returned by the selected SIA2 collection is listed; search results can change as the archive is updated.</li>
          <li>FITS cutouts are fetched on demand and limited to 0.2 degrees. The entire archive is never downloaded.</li>
          <li>Previews use the calibrated IMAGE extension, display a percentile/asinh stretch, and preserve the source observation timestamp and units.</li>
          <li>Comparison images are reprojected using the archive WCS; their astrometric alignment is not independently checked against stars. No PSF matching, background subtraction, uncertainty propagation, or detection statistics are performed here.</li>
          <li>A difference in two displayed images is not proof of an astronomical discovery. Use the original FITS files and mission documentation for analysis.</li>
        </ul>
      </section>

      <section className="si-disclosure">
        <p className="eyebrow">SI-ASSISTED DEVELOPMENT DISCLOSURE</p>
        <p>AI assistance was used for coding, debugging, design, documentation and development of the data-processing workflow. The supplied hero artwork is an AI-generated decorative illustration; it is not an observation or mission image. Scientific observation metadata and preview pixels are obtained from NASA/IPAC IRSA and processed using the documented pipeline, not generated by AI.</p>
      </section>
    </div>
  );
}
