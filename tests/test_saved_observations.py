import json
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image


def test_saved_manifest_points_to_displayable_archive_cutouts():
    directory = Path(__file__).resolve().parents[1] / "public" / "observations"
    manifest = json.loads((directory / "manifest.json").read_text())
    entries = [item for region in manifest["regions"] for item in region["observations"]]
    assert {item["observation"]["release"] for item in entries} >= {"spherex_dr1", "spherex_qr3"}

    for item in entries:
        assert item["observation"]["access_url"].startswith(
            "https://irsa.ipac.caltech.edu/ibe/data/spherex/"
        )
        with fits.open(directory / item["fits_file"], memmap=False) as hdus:
            data = hdus["IMAGE"].data
            assert list(data.shape) == item["image_shape"]
            assert np.isfinite(data).any()
            assert hdus["IMAGE"].header["DATE-OBS"] == item["fits_date_obs"]
        with Image.open(directory / item["image_file"]) as image:
            image.verify()


def test_saved_comparison_has_matching_grid_mask_and_real_cutout():
    directory = Path(__file__).resolve().parents[1] / "public" / "observations"
    manifest = json.loads((directory / "manifest.json").read_text())
    pair = manifest["regions"][0]["comparisons"][0]
    with Image.open(directory / pair["before_image"]) as before, Image.open(directory / pair["after_image"]) as after:
        before_pixels, after_pixels = np.asarray(before.convert("RGBA")), np.asarray(after.convert("RGBA"))
    assert before_pixels.shape == after_pixels.shape
    assert np.array_equal(before_pixels[:, :, 3], after_pixels[:, :, 3])
    assert np.count_nonzero(before_pixels[:, :, 3]) == pair["details"]["valid_pixels"]
    with fits.open(directory / pair["later_cutout_file"]) as hdus:
        assert hdus["IMAGE"].header["FINAST"] == 0
        assert hdus["IMAGE"].header["DATE-OBS"].startswith(pair["later"]["observation_time_utc"][:16])


def test_saved_comparison_has_coarse_image_alignment():
    directory = Path(__file__).resolve().parents[1] / "public" / "observations"
    pair = json.loads((directory / "manifest.json").read_text())["regions"][0]["comparisons"][0]
    with Image.open(directory / pair["before_image"]) as before, Image.open(directory / pair["after_image"]) as after:
        a, b = np.asarray(before.convert("RGBA")), np.asarray(after.convert("RGBA"))
    mask = a[:, :, 3] > 0
    correlations = {}
    height, width = mask.shape
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            ys, yt = slice(max(0, dy), min(height, height + dy)), slice(max(0, -dy), min(height, height - dy))
            xs, xt = slice(max(0, dx), min(width, width + dx)), slice(max(0, -dx), min(width, width - dx))
            overlap = mask[ys, xs] & mask[yt, xt]
            correlations[dy, dx] = np.corrcoef(a[ys, xs, 0][overlap], b[yt, xt, 0][overlap])[0, 1]
    assert max(correlations, key=correlations.get) == (0, 0)
