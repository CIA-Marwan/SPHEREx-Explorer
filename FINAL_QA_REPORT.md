# Final QA report

Reviewed 2026-11-15. PASS applies only to the tested behavior, not to the whole requested release. A static version is deployed; no submission has been made.

| Feature | Expected Result | Actual Result | Status | Evidence |
|---|---|---|---|---|
| Local build and tests | Build and automated regression tests pass | Vite production build, 8 frontend and 17 Python tests passed | PASS | `npm run build`, `npm test`, `python -m pytest -q` |
| Home and navigation | Navigate to tools and explain workflow | Home to Explore and Explore to Compare exercised; all six routes returned HTTP 200 | PASS | Local browser checks; 375/767/1440 CSS pixels |
| Saved observations | Display real DR1/QR3 images with matching metadata | Both saved FITS files and PNGs validated; QR3 selection displayed | PASS | [Data validation](DATA_VALIDATION_REPORT.md), tests and browser |
| Live archive preview | Fetch bounded real FITS image | DR1 preview returned HTTP 200; QR3 cutout recheck returned 503 | PASS | Local API and source requests; archive failures remain possible |
| Compare | Correctly inspect a safe example pair | One wavelength-screened DR1 pair, slider keyboard operation, side-by-side, zoom, pan and reset exercised | PASS | Browser check; [comparison methodology](docs/data-and-science.md) |
| Coordinate-selected temporal sequences | Create aligned images over time for requested coordinates | Only one precomputed pair exists | FAIL | **CRITICAL:** core challenge workflow is incomplete |
| Challenge target comparison | Verify sequences for five named targets | Metadata coverage was checked previously; no target pair validated | FAIL | **HIGH:** target motion cannot be assessed with current comparison |
| Scientific difference | Perform defensible difference measurement | Disabled | BLOCKED | **HIGH:** independent registration, PSF/background treatment and uncertainty propagation are missing |
| Object catalog | Browse and filter a verified full catalog | SIMBAD resolution and session-only filters available | FAIL | **MEDIUM:** catalog is not comprehensive; no object-specific pair |
| Timeline | Step through genuine dates | Manual stepping implemented; records not necessarily compatible | PASS | Prior browser check; no automatic unsafe blink |
| About and attribution | Explain sources, limitations and SI use | Disclosures and citations provided | PASS | About page and [data sources](DATA_SOURCES.md); asset rights require verification |
| Hero watermark | Visible SI indication | Hero PNG includes an SI mark, but the page can crop it and no longer adds a label | BLOCKED | Verify the displayed artwork meets submission requirements at all screen sizes |
| Favicon provenance | Identify origin and watermark if SI-generated | User-supplied favicon has no visible text watermark; origin unknown | BLOCKED | **HIGH:** team must confirm provenance, rights and watermark requirements |
| Accessibility | Keyboard, responsive and WCAG 2.2 AA | Keyboard slider and responsive routes checked; no horizontal overflow in tested viewports | NOT TESTED | **MEDIUM:** full screen-reader, contrast, touch and WCAG conformance audits not performed |
| Security | No exposed secrets or critical vulnerabilities | Narrow text scan found no obvious credential patterns; npm audit found zero vulnerabilities; cutout URL and redirect restrictions added | NOT TESTED | **HIGH:** no comprehensive security review, Python vulnerability audit, rate limiting or Git history review; no Git repository exists |
| Licensing | Document code and third-party rights | MIT chosen for project code; direct dependency declarations documented | BLOCKED | **HIGH:** artwork rights, transitive licenses and required notices need owner review |
| Public deployment | HTTPS site and routes accessible without account | GitHub Pages static version deployed and checked | PASS | [Live site](https://cia-marwan.github.io/SPHEREx-Explorer/); public route refresh, saved observations and visual comparison tested. Live API functionality remains unavailable |
| Team and challenge eligibility | Registered team and eligible timeline | Team/event unknown; some files predate normal hackathon start | BLOCKED | **CRITICAL:** ask Local Lead about timing and confirm registration |
| Public demo | Public ≤30-second video or ≤7-slide deck | Script prepared, no demo or public link | BLOCKED | **CRITICAL:** required demo link unavailable |
| Submission | Complete official form and submit for judging | Actual form not accessed; no submission confirmation | BLOCKED | **CRITICAL:** authorized team member must complete and submit |
| Persistent end-to-end suite | Reusable complete browser automation | Ad hoc Playwright browser checks performed | NOT TESTED | **MEDIUM:** no persistent E2E suite or complete control audit |

## Verification details

- 2026-11-15: `npm test` 8 passed, `npm run build` passed, `python -m pytest -q` 17 passed. `npm audit` reported zero vulnerabilities; `python -m pip check` reported no broken requirements. These do not replace a Python vulnerability audit.
- All six routes were loaded locally at measured widths of 375, 767 and 1440 CSS pixels; sampled checks found no horizontal overflow, broken completed image elements or JavaScript `pageerror` events during those checks. The browser's scaling prevented an exact 768-pixel test. This is not a full accessibility or visual audit.
- The browser selected QR3 and its source metadata, opened Compare, changed its keyboard slider from 50 to 51, zoomed and panned, switched side-by-side and reset to 50. Prior checks included drag, blink, SIMBAD, timeline and error handling; not every control or external link was retested today.
- GitHub Actions deployed the static site successfully on 2026-11-15. Public HTTPS hash routes and refreshes, QR3 selection, saved thumbnails, comparison image loading, keyboard slider, side-by-side, zoom, reset and 375-pixel layout were checked. No JavaScript page errors or failed same-origin responses were observed during the tested journey. Live API functionality is not available on Pages.
- Earlier local browser console connection errors occurred while the temporary server was stopped; live archive requests have also intermittently returned 502/503.
- [Compliance review](NASA_SUBMISSION_COMPLIANCE.md), [data validation](DATA_VALIDATION_REPORT.md), and [submission checklist](submission/SUBMISSION_CHECKLIST.md) contain evidence and necessary actions.
