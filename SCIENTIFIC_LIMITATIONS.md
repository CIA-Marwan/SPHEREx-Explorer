# Scientific limitations

- The only precomputed visual comparison is one DR1 D3 pair in the IRSA example field; arbitrary-coordinate aligned sequences, QR3/DR1 comparisons and target-specific sequences are not implemented.
- SPHEREx detector-wide SIA wavelength ranges do not establish per-pixel spectral equivalence. The pair uses official CWAVE/CBAND maps and an application-defined 10% bandwidth screen, not a mission-certified equivalence test.
- Archive WCS and nearest-neighbor reprojection are used; independent source-matched and subpixel registration are not established. Resampling and display stretching introduce visual artifacts.
- PSF matching, zodiacal/background subtraction and uncertainty propagation are absent. Scientific difference images and candidate detection are disabled. Apparent differences are not confirmed discoveries.
- SIMBAD resolution and SIA2 sky coverage do not establish that SPHEREx detected a named object; moving-object positions may be epoch dependent.
- Live services can fail or change; saved examples are limited. See [methodology](docs/data-and-science.md) and [data validation](DATA_VALIDATION_REPORT.md).
