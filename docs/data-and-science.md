# Data sources and scientific interpretation

## Archive data

Observation metadata and source FITS products are obtained from the NASA/IPAC Infrared Science Archive (IRSA) SPHEREx SIA2 service. The application searches these collections:

- `spherex_dr1`
- `spherex_dr1_deep`
- `spherex_qr3`
- `spherex_qr3_deep`

The UI reports the selected collection and metadata returned by SIA2. The saved examples are downloaded archive cutouts; live search results are not simulated. IRSA search access and complete product details are documented in the [SPHEREx archive guide](https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/).
Successful SIA2 search responses are cached in ten-minute windows in each API process. Preview and bounded cutout caches are also process-local; they are not a substitute for deployment-level rate limits.

## FITS preview

The backend accepts only HTTPS product URLs from `irsa.ipac.caltech.edu` in the SPHEREx IBE data path. It requests a small sky cutout, limits the response size, and reads the `IMAGE` FITS extension. The displayed PNG uses a percentile-based asinh stretch for visibility; it is a visualization of the archive pixels, not a photometric measurement.

Cutouts are bounded to 0.2 degrees. The application does not download the full archive, perform PSF matching, or calibrate measurements between exposures.

## Comparisons and timeline

The supplied example pair is selected from the same DR1 detector and checked against the official CWAVE and CBAND calibration product. The calibration file checksum and WCS-WAVE tables are verified, and both cutouts must have matching spectral and absolute-gain calibration IDs, pipeline versions, Level 2 calibration, exposure times within 1%, and `FINAST=0`. Only finite IMAGE pixels with positive VARIANCE and no flags other than SOURCE are accepted. SOURCE (bit 21) identifies a known source and is not a bad-pixel flag; see Table 16 of the [SPHEREx Explanatory Supplement](https://irsa.ipac.caltech.edu/data/SPHEREx/docs/SPHEREx_Expsupp.pdf).

The later cutout is reprojected with nearest-neighbor sampling onto the earlier WCS. The same source pixel is used for intensity and calibrated wavelength/bandwidth screening; those values must differ by no more than 10% of the narrower bandwidth. This is an application-defined screening threshold, not a mission-certified equivalence or a comparison of full spectral response curves. The requested sky position must pass, and at least 100 valid pixels must overlap. A single percentile/asinh stretch is applied to both images. The images use the archive astrometric solution; alignment has not been independently checked against stars. Nearest-neighbor resampling can introduce pixel-level artifacts and is not a flux-conserving measurement.

The detector band reported by SIA2 is not a per-pixel wavelength: the linear variable filter changes the wavelength across the detector. The pair is intended only for visual inspection. No PSF matching, zodiacal subtraction or uncertainty propagation is performed, so a scientific difference image is disabled and apparent differences must not be interpreted as discoveries.

An offline regression test checks that the two shipped preview images correlate most strongly at zero integer-pixel offset among shifts of up to two pixels. This is only a coarse consistency check, not a source-matched or subpixel astrometric validation.

The timeline steps manually between returned records in timestamp order. Individual live previews can have different wavelengths, WCS geometry and display stretches; they are not valid before/after comparisons. Only the screened, aligned example pair can be blinked in Compare. No synthesized or predicted frames are created.

## Object resolver

Object names are resolved through the SIMBAD service operated by CDS. The result displays the returned name and coordinates. SPHEREx coverage is queried separately; a resolved catalog position is not evidence that SPHEREx detected the object.

## Product references

- [SPHEREx Data Release 1 Spectral Images (IRSA678)](https://www.ipac.caltech.edu/doi/10.26131/IRSA678)
- [SPHEREx Data Release 1 All-Sky Cube (IRSA679)](https://www.ipac.caltech.edu/doi/10.26131/IRSA679)
- [NASA/IPAC SPHEREx Archive](https://irsa.ipac.caltech.edu/Missions/spherex.html)
- [SIMBAD Astronomical Database](https://simbad.cds.unistra.fr/)
- [2026 Planet X and SPHEREx challenge and Resources tab](https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/?tab=resources)
- [SPHEREx tutorial notebooks](https://caltech-ipac.github.io/irsa-tutorials/spherex/)

The supplied hero artwork is AI-generated and decorative only; it is not an astronomical observation or a SPHEREx mission image. The hero PNG contains a visible "SI-Generated Illustration" mark in its pixels; the site adds a separate label because cropping can hide the original mark. The deployed PNG also contains a description. The origin and rights of the separately supplied favicon remain to be confirmed. This independent project is not an official NASA website.
