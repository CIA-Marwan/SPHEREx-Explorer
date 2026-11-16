# Scientific data validation

Checked 2026-11-15. PASS means the stated local evidence was checked, not that every archive source or scientific interpretation was independently verified.

The saved cutouts cover the documented IRSA example position RA 127.69444°, Dec −39.17760° (ICRS), with a 0.1° cutout request. FITS celestial WCS places the requested position inside each 59 × 58 IMAGE array. Individual SIA `s_ra`/`s_dec` fields are observation centers, not the cutout center. The products have `BUNIT = MJy / sr`; PNGs use finite science pixels and a false-color 1st–99th percentile asinh display stretch.

| Observation | Release / detector | FITS DATE-OBS UTC | Detector-wide SIA range | Source and local evidence | Status |
|---|---|---|---|---|---|
| 2025W17_4B_0127_1 | DR1 / D3 | 2025-04-25T14:00:26.045 | 1.6301–2.4346 µm | [FITS source](https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W17_4B/l2b-v27-2026-196/3/level2_2025W17_4B_0127_1D3_spx_l2b-v27-2026-196.fits); saved FITS and PNG pass tests; live cutout returned HTTP 200 | PASS |
| 2026W21_1A_0480_1 | QR3 / D1 | 2026-05-21T03:27:20.505 | 0.7455–1.1167 µm | [FITS source](https://irsa.ipac.caltech.edu/ibe/data/spherex/qr3/level2/2026W21_1A/l2b-v27-2026-268/1/level2_2026W21_1A_0480_1D1_spx_l2b-v27-2026-268.fits); saved FITS and PNG pass tests | PASS locally; live recheck BLOCKED by HTTP 503 |
| 2026W18_1A_0045_1 | DR1 / D3 | 2026-04-27T04:15:33.253 | 1.6301–2.4346 µm | [FITS source](https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2026W18_1A/l2b-v27-2026-244/3/level2_2026W18_1A_0045_1D3_spx_l2b-v27-2026-244.fits); saved FITS and comparison PNG; live cutout returned HTTP 200 | PASS locally |

SIA timestamps are derived from rounded MJD and differ from FITS `DATE-OBS` by milliseconds: the UI uses SIA values, while the table reports FITS header values. The listed detector ranges are not per-pixel wavelengths. Full source products were not downloaded during this recheck. The QR3 source was downloaded previously, but current 503 prevents a fresh archive comparison. Local metadata and matching image files alone cannot independently establish provenance of every byte.

## Comparison

The 2025/2026 D3 pair uses the [official detector-3 spectral calibration](https://nasa-irsa-spherex.s3.us-east-1.amazonaws.com/dr1/spectral_wcs/cal-swcs-v5-2026-191/3/spectral_wcs_D3_spx_cal-swcs-v5-2026-191.fits), checksum `51750c8f948a30541d391e54930279aa067c62c398a7cc2679e592bc6044427a`, CWAVE/CBAND pixel screening, consistent calibration IDs and exposure, positive variance, flag masking and `FINAST=0`. The later image is reprojected to the earlier WCS using nearest neighbor; both use the same mask and display stretch. 3,272/3,422 pixels pass. At the requested position, the calibrated center is about 2.383073 µm, bandwidth 0.059797 µm.

**BLOCKED:** Source-matched and subpixel alignment, PSF matching, zodiacal/background subtraction, uncertainty propagation and photometric differences have not been independently validated. The 10% bandwidth screen is an application heuristic, not a mission-certified criterion. No candidate detection or scientific difference image is claimed. See [methodology](docs/data-and-science.md) and [manifest](public/observations/manifest.json) for provenance.

No fabricated metadata was identified in the checked files; this is not proof that all untested archive products are valid. Decorative hero art is not scientific data.
