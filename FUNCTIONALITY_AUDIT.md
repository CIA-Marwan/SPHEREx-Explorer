# Functionality audit

Updated 2026-11-14. PASS means the stated limited behavior was checked; it does not imply completion of the full challenge.

## Addressed

- [x] Home navigation, Explore CTA and How It Works workflow link; existing visual design retained.
- [x] Real DR1 and QR3 saved FITS cutouts, PNGs, metadata, source URLs and manifest; live SIA2 search and bounded FITS previews with explicit errors.
- [x] One DR1 example pair screened using calibrated pixel wavelengths and bandwidths, calibration provenance, flags, positive variance and exposure; nearest-neighbor WCS reprojection and a common display stretch. Nearest-neighbor screening uses the same source pixel as the intensity.
- [x] Comparison slider, keyboard range control, side-by-side, opt-in blink, synchronized zoom/pan, reset, dates and source metadata. Explore links to its screened saved region.
- [x] Timeline steps through genuine archive timestamps without automatically blinking unregistered, differently stretched observations.
- [x] SIMBAD name resolver and session-only name/type filtering; returned object type uses SIMBAD `otype` rather than morphology. No claim of a complete catalog or a detection.
- [x] Viewer pixel scale derived from the celestial WCS instead of the misleading raw FITS `CDELT2`.
- [x] About and documentation describe sources, SI/AI assistance, processing and scientific limitations; decorative hero image has embedded descriptive metadata.
- [x] Responsive and keyboard checks, loading/error states, reduced-motion styles, focus indicators, unit/regression tests, production build and documented deployment options.

## Unresolved or limited

- [ ] Arbitrary-coordinate aligned sequences, object-specific comparisons and QR3/DR1 compatible temporal pairs are not available. The only saved pair is DR1 vs DR1.
- [ ] The image WCS has not been independently registered against stars; a coarse zero-integer-shift image correlation is not subpixel astrometry. The 10%-of-bandwidth threshold is an application heuristic, not a mission-certified criterion.
- [ ] Scientific difference images and candidate detection remain disabled: PSF matching, background treatment and reliable uncertainty propagation are missing.
- [ ] Five challenge target names resolved through SIMBAD and their coordinates returned DR1 SIA2 records, but this is metadata coverage only, not compatible sequences or object detections. WISE 0855 was resolved as `WISE J085510.83-071442.5`; moving-object positions can depend on epoch.
- [ ] An RW Aurigae D3 search found 38 records and 361 potential repeat pairs; among the ten closest-pointed candidates tested, one cutout request returned HTTP 503 and nine failed the compatible-valid-pixel screen. No valid pair was established; other candidates were not exhausted.
- [ ] The object page is a resolver and current-session list, not a complete browsable verified catalog.
- [ ] Live IRSA requests intermittently returned 502/503. Search caching is process-local and time-windowed; a public deployment also needs rate limits, monitoring and appropriate network protections.
- [ ] The hero PNG contains an SI-generated watermark, but the site can crop it and no longer overlays a label; the separately supplied favicon's provenance and rights require confirmation. Netlify proxy timeout may be shorter than archive requests.
- [ ] A persistent end-to-end automation suite, full assistive-technology testing and a WCAG conformance audit have not been completed.
- [ ] Manifest regeneration removes the comparison entry; follow the README to rebuild it.

## Primary resources

[NASA/IPAC SPHEREx archive](https://irsa.ipac.caltech.edu/Missions/spherex.html), [data access documentation](https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/), [2026 Planet X and SPHEREx challenge resources](https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/?tab=resources), and [SPHEREx tutorials](https://caltech-ipac.github.io/irsa-tutorials/spherex/). Challenge resources also list WiseView, Gaia DR3 and CSA resources; availability of links does not establish challenge compliance.
