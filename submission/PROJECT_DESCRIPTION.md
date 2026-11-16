# High-Level Project Summary

SPHEREx Explorer helps people inspect real near-infrared observations from NASA/IPAC's SPHEREx archive. Visitors can search by sky coordinates, view saved DR1 and QR3 cutouts, inspect observation metadata and compare one prepared pair from different dates. Repeated observations can help people explore changes across time, but this comparison is for visual inspection only: it is not a detection or a confirmed discovery. The current tool does not yet create aligned sequences for arbitrary coordinates.

# Detailed Project Description

SPHEREx surveys the sky repeatedly at near-infrared wavelengths. Its large collection of images is difficult to explore by eye, particularly when observations have different wavelengths or geometric alignment.

The site searches NASA/IPAC SIA2 by coordinates and displays bounded FITS image cutouts with dates, detector bands and original source links. A SIMBAD resolver helps users locate named objects, while a timeline displays individual archive timestamps. The Compare page presents one saved DR1 pair screened using the mission's per-pixel wavelength calibration and reprojected to a common WCS. Users can drag a divider, view images side by side or blink them with shared zoom and pan.

This is an independent educational interface, not an official NASA product. The screen does not prove a change is astrophysical. Independent stellar registration, PSF matching, background subtraction and uncertainty propagation are absent, so scientific difference imaging and detection are disabled. The current object page is a name resolver rather than a complete catalog; arbitrary-coordinate time sequences are not yet available.
