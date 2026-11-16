# Data, resources and licenses

## NASA/IPAC resources actually incorporated

- [NASA/IPAC IRSA SPHEREx archive](https://irsa.ipac.caltech.edu/Missions/spherex.html): SIA2 observation searches and Level 2 FITS cutouts from DR1 and QR3; listed on the challenge's Resources tab.
- [DR1 spectral images, IRSA678](https://www.ipac.caltech.edu/doi/10.26131/IRSA678): reference for DR1 spectral image products.
- [SPHEREx data-access documentation](https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/): SIA2 collections and FITS cutout access.
- [SPHEREx Explanatory Supplement](https://irsa.ipac.caltech.edu/data/SPHEREx/docs/SPHEREx_Expsupp.pdf): image extensions, flags and calibration context.
- [DR1 D3 spectral calibration](https://nasa-irsa-spherex.s3.us-east-1.amazonaws.com/dr1/spectral_wcs/cal-swcs-v5-2026-191/3/spectral_wcs_D3_spx_cal-swcs-v5-2026-191.fits): CWAVE/CBAND maps used to screen the saved comparison.

The [DR1 All-Sky Cube reference](https://www.ipac.caltech.edu/doi/10.26131/IRSA679) is cited for context; cube data is **not** used by the app. Follow archive terms and attribution guidance; the project MIT license does not relicense NASA/IPAC data.

## Other incorporated resources

- [SIMBAD, CDS](https://simbad.cds.unistra.fr/): object name, coordinates and classification code via Sesame. Follow CDS citation and data-use terms.
- Supplied hero artwork and favicon: user-provided; the hero is disclosed as AI-generated in the site information. Generator, source rights, favicon provenance and permission to redistribute must be confirmed by the submitter. The MIT code license does not establish rights to these assets.
- Screenshots are captures of this application and contain the artwork/data described above; they do not establish independent rights to those assets.

## Software license notices

The project owner selected [MIT](LICENSE) for original project code; third-party software and data retain their own licenses. Direct npm dependency declarations inspected from installed packages: React, React DOM, React Router DOM, TanStack React Query, Motion, Recharts and Zustand: MIT; Lucide React: ISC; OpenSeadragon: BSD-3-Clause. Development dependencies include TypeScript: Apache-2.0; Vite, Vitest, Tailwind, Testing Library, jsdom and listed type packages: MIT. See [package.json](package.json), [package-lock.json](package-lock.json), and each installed package's license for complete notices and transitive dependencies.

Python direct dependencies as installed: FastAPI MIT, Uvicorn BSD-3-Clause, Astropy BSD-3-Clause, NumPy `BSD-3-Clause AND 0BSD AND MIT AND Zlib AND CC0-1.0`, Pillow MIT-CMU, and Reproject BSD-3-Clause. See [requirements.txt](requirements.txt) and distribution license files. Versions may vary with the permitted ranges; the submitter must audit the actual deployment environment and transitive dependencies.

WiseView, Gaia, CSA resources and tutorial notebooks were reviewed as challenge resources but are not claimed as incorporated. Verify all permissions, required attribution, exact license notices, and accessibility before submission.
