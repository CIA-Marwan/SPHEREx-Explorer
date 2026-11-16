import numpy as np
import pytest
from astropy.wcs import WCS

from scripts.build_comparison import align_pair


def image(x_shift=0, wavelength=2.0):
    wcs = WCS(naxis=2)
    wcs.wcs.crpix = [8 + x_shift, 8]
    wcs.wcs.cdelt = [-0.001, 0.001]
    wcs.wcs.crval = [127.0, -39.0]
    wcs.wcs.ctype = ["RA---TAN", "DEC--TAN"]
    pixels = np.indices((16, 16))[1].astype(float) - x_shift
    return {
        "data": pixels, "valid": np.ones((16, 16), dtype=bool),
        "wavelength": np.full((16, 16), wavelength),
        "bandwidth": np.full((16, 16), 0.06),
        "wcs": wcs, "exposure": 113.0,
        "calibration_ids": {"spectral_wcs": "a", "abs_gain_matrix": "b"},
        "version": "7.0.5",
    }


def test_aligns_spatial_grid_and_masks_bad_pixels():
    first, later = image(), image(x_shift=1)
    first["valid"][5, 5] = False
    ra, dec = first["wcs"].pixel_to_world_values(8, 8)

    before, after, mask, details = align_pair(first, later, float(ra), float(dec))

    assert before[8, 8] == pytest.approx(after[8, 8], abs=1e-4)
    assert not mask[5, 5]
    assert details["valid_pixels"] >= 100


def test_rejects_mismatched_wavelength_and_calibration():
    first, later = image(), image(wavelength=2.02)
    ra, dec = first["wcs"].pixel_to_world_values(8, 8)
    with pytest.raises(ValueError, match="compatible valid pixels"):
        align_pair(first, later, float(ra), float(dec))

    later = image()
    later["calibration_ids"]["abs_gain_matrix"] = "other"
    with pytest.raises(ValueError, match="Calibration provenance"):
        align_pair(first, later, float(ra), float(dec))


def test_spectral_screen_applies_to_the_pixel_used_for_intensity():
    first, later = image(), image(x_shift=0.25)
    later["data"][8, 8] = 42
    later["data"][8, 9] = 1000
    later["wavelength"][8, 9] = 2.02
    ra, dec = first["wcs"].pixel_to_world_values(8, 8)

    _, after, mask, _ = align_pair(first, later, float(ra), float(dec))

    assert mask[8, 8]
    assert after[8, 8] == 42
