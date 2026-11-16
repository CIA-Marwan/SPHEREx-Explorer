# SPHEREx Explorer

A React and FastAPI interface for searching real SPHEREx archive observations, previewing bounded FITS cutouts, visually comparing a calibrated and WCS-reprojected pair, resolving catalog names, and browsing archive timestamps.

## Challenge and solution

The [2026 Planet X and SPHEREx challenge](https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/) asks for a public tool to inspect repeated sky images. This project searches NASA/IPAC DR1 and QR3 records, previews real image cutouts, and offers one precomputed DR1 visual comparison. Arbitrary-coordinate aligned sequences and object detection are **not implemented**; the comparison is not proof of a discovery. Eligibility, including work begun before the event, requires Local Lead review; see [compliance review](NASA_SUBMISSION_COMPLIANCE.md).

**Stack:** React, TypeScript, Vite, FastAPI, Astropy, NumPy, Pillow and Reproject; see [stack details](submission/TECHNOLOGY_STACK.md).

**GitHub Pages:** https://cia-marwan.github.io/SPHEREx-Explorer/ (static version). **Repository:** https://github.com/CIA-Marwan/SPHEREx-Explorer

Screenshots: [Home](screenshots/home.png) · [Compare](screenshots/compare.png). The Home screenshot contains labeled AI-generated decorative art, not astronomical data.

## Requirements

- Node.js 20.19+ or 22.12+
- Python 3.11+

## Run locally

Install frontend dependencies once:

```sh
npm install
```

Install the API dependencies in a virtual environment:

```sh
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Start the API and frontend in separate terminals from this directory:

```sh
source .venv/bin/activate
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

```sh
npm run dev
```

Open the Vite URL printed in the frontend terminal (normally `http://127.0.0.1:5173`). The frontend proxies `/api` requests to the local FastAPI service.

To regenerate the saved example cutouts and manifest:

```sh
python scripts/build_observation_manifest.py
```

The script queries DR1 and QR3, downloads small FITS cutouts and writes PNGs and a manifest under `public/observations/`. To rebuild the example comparison after regenerating the manifest, download the official detector-3 spectral calibration and run:

```sh
curl -fL 'https://nasa-irsa-spherex.s3.us-east-1.amazonaws.com/dr1/spectral_wcs/cal-swcs-v5-2026-191/3/spectral_wcs_D3_spx_cal-swcs-v5-2026-191.fits' -o spectral-calibration-d3.fits
python scripts/build_comparison.py --calibration spectral-calibration-d3.fits
```

The calibration is about 32 MB; the script verifies its checksum and its lookup table against each image. The comparison pipeline currently builds one DR1 detector-3 example, not arbitrary archive pairs. IRSA availability can affect regeneration.

For a same-origin production build, run `npm run build`, then serve FastAPI with `python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000`. Configure HTTPS, rate limits, and appropriate network protections at a reverse proxy before exposing the service publicly.
The API rejects redirects from cutout requests; if IRSA changes its delivery behavior, requests will fail explicitly until the trusted endpoint policy is reviewed.

### GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and deploys `dist` when `main` is pushed. In repository Settings → Pages, select **GitHub Actions** as the source. The Pages build uses `/SPHEREx-Explorer/` and hash routes such as `/#/compare` so directly opening or refreshing a route works on static hosting.

GitHub Pages cannot run FastAPI. The Pages version supports the saved DR1/QR3 observations, metadata, source links and one screened visual comparison; live coordinate search, on-demand FITS previews, the live timeline and SIMBAD resolution are unavailable. Use the same-origin FastAPI setup above for those features. No separately hosted API is configured for Pages.

To check the Pages build locally:

```sh
npm run build -- --mode pages
npm run preview -- --mode pages
```

### Netlify frontend with a separate API

The FastAPI application is required for live archive searches, cutouts, and SIMBAD; a static frontend alone only has the saved observations. Deploy the API to a separately managed HTTPS service with appropriate request limits and monitoring. Then, before building for Netlify, create `public/_redirects`, replacing the example origin with the actual API origin:

```text
/api/*  https://YOUR-API-HOST.example/api/:splat  200
/*      /index.html                              200
```

Configure Netlify's build command as `npm run build` and publish directory as `dist`. The first rule proxies API requests; the second supports direct SPA routes, while real static files remain accessible. Netlify documents a **26-second proxy timeout**, shorter than this application's archive timeouts, so slow live searches or previews may fail there. For reliable long-running archive requests, use the same-origin FastAPI deployment behind a reverse proxy instead, or implement an asynchronous backend workflow. Test HTTPS, direct-route refreshes, the API, source links, and images at the resulting public URL. No public deployment has been tested.

See [Netlify rewrites and proxies](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/) for current behavior.

## Validation

```sh
npm test
npm run build
python -m pytest -q
```

## Main workflows

- **Explore:** search SIA2 with coordinates, release, radius, and optional detector; inspect metadata and a FITS cutout.
- **Compare:** inspect the saved, wavelength-screened pair in a WCS-reprojected slider or side-by-side view. A scientific difference image is not available.
- **Objects:** resolve names through SIMBAD, filter names resolved during the current visit, and search around the catalog coordinates. This is not a full browsable object catalog.
- **Timeline:** plot and step through returned archive timestamps. Individual previews are not aligned or wavelength-screened; blink the saved screened pair in Compare instead.
- **About:** review citations and the scientific limitations.

See [docs/data-and-science.md](docs/data-and-science.md) for data sources, proxy limits, and interpretation notes.

## Credits, licensing and disclosures

- NASA/IPAC IRSA supplies the observations and calibration; CDS supplies SIMBAD name resolution. See [data sources and third-party licenses](DATA_SOURCES.md).
- The owner selected the [MIT license](LICENSE) for original project code; third-party assets and data retain their own terms. User-supplied artwork rights and favicon provenance remain unverified.
- [SI disclosure](SI_DISCLOSURE.md) and [scientific limitations](SCIENTIFIC_LIMITATIONS.md).
- [Submission materials](submission/SUBMISSION_CHECKLIST.md), [data validation](DATA_VALIDATION_REPORT.md), and [QA report](FINAL_QA_REPORT.md). No submission has been made.
