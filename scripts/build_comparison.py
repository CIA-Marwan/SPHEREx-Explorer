"""Build a wavelength-screened, WCS-aligned visualization from archive cutouts."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import sys
from pathlib import Path

import numpy as np
from astropy.io import fits
from astropy.wcs import WCS
from fastapi import HTTPException
from PIL import Image
from reproject import reproject_interp

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend.main import _download_cutout, search_observations

CALIBRATION_URL = (
    "https://nasa-irsa-spherex.s3.us-east-1.amazonaws.com/dr1/spectral_wcs/"
    "cal-swcs-v5-2026-191/3/spectral_wcs_D3_spx_cal-swcs-v5-2026-191.fits"
)
SOURCE_FLAG = 1 << 21
CALIBRATION_SHA256 = "51750c8f948a30541d391e54930279aa067c62c398a7cc2679e592bc6044427a"


def read_cutout(payload: bytes, calibration: fits.HDUList) -> dict:
    with fits.open(io.BytesIO(payload), memmap=False) as hdus:
        image = hdus["IMAGE"]
        header = image.header.copy()
        data = np.asarray(image.data, dtype=float)
        variance = np.asarray(hdus["VARIANCE"].data, dtype=float)
        flags = np.asarray(hdus["FLAGS"].data)
        if data.ndim != 2 or data.shape != variance.shape or data.shape != flags.shape:
            raise ValueError("Cutout IMAGE, VARIANCE, and FLAGS shapes do not match.")
        if data.size > 2_000_000 or header.get("BUNIT", "").strip() != "MJy / sr":
            raise ValueError("Unsupported image size or surface-brightness unit.")
        if header.get("FINAST") != 0:
            raise ValueError("The cutout does not have a good FINAST astrometric quality flag.")
        for column in ("X", "Y", "VALUES"):
            if not np.array_equal(
                hdus["WCS-WAVE"].data[column][0],
                calibration["WCS-WAVE"].data[column][0],
            ):
                raise ValueError("The cutout lookup table does not match the calibration product.")

        x_offset = 1 - float(header["CRPIX1A"])
        y_offset = 1 - float(header["CRPIX2A"])
        if not x_offset.is_integer() or not y_offset.is_integer():
            raise ValueError("Cutout detector pixel mapping is not integral.")
        x0, y0 = int(x_offset), int(y_offset)
        h, w = data.shape
        wave_map = calibration["CWAVE"].data
        band_map = calibration["CBAND"].data
        if x0 < 0 or y0 < 0 or x0 + w > wave_map.shape[1] or y0 + h > wave_map.shape[0]:
            raise ValueError("Cutout lies outside the spectral calibration map.")
        wavelength = np.asarray(wave_map[y0:y0 + h, x0:x0 + w], dtype=float)
        bandwidth = np.asarray(band_map[y0:y0 + h, x0:x0 + w], dtype=float)
        histories = header.get("HISTORY", [])
        calibration_ids = {}
        for name in ("spectral_wcs", "abs_gain_matrix"):
            matches = {
                str(item).split()[-1]
                for item in histories if str(item).startswith(f"[CALIB] {name} ")
            }
            if len(matches) != 1:
                raise ValueError(f"The cutout lacks an unambiguous {name} calibration ID.")
            calibration_ids[name] = matches.pop()
        version = hdus[0].header.get("VERSION")
        if not version:
            raise ValueError("The cutout lacks a pipeline version.")
        exposure = float(header["XPOSURE"])
        if not np.isfinite(exposure) or exposure <= 0:
            raise ValueError("Invalid exposure time.")
        valid = (
            np.isfinite(data) & np.isfinite(variance) & (variance > 0)
            & ((flags & ~SOURCE_FLAG) == 0)
            & np.isfinite(wavelength) & np.isfinite(bandwidth) & (bandwidth > 0)
        )
        return {
            "data": data, "variance": variance, "valid": valid,
            "wavelength": wavelength, "bandwidth": bandwidth,
            "wcs": WCS(header).celestial, "exposure": exposure,
            "calibration_ids": calibration_ids, "version": version,
        }


def align_pair(first: dict, second: dict, ra: float, dec: float) -> tuple[np.ndarray, np.ndarray, np.ndarray, dict]:
    if first["calibration_ids"] != second["calibration_ids"] or first["version"] != second["version"]:
        raise ValueError("Calibration provenance or pipeline versions differ.")
    if abs(first["exposure"] - second["exposure"]) > 0.01 * first["exposure"]:
        raise ValueError("Exposure times differ by more than 1%.")
    shape = first["data"].shape

    def project(array: np.ndarray, order: str) -> np.ndarray:
        result, footprint = reproject_interp(
            (array, second["wcs"]), first["wcs"], shape_out=shape, order=order
        )
        result[footprint <= 0] = np.nan
        return result

    later_flux = project(np.where(second["valid"], second["data"], np.nan), "nearest-neighbor")
    later_wave = project(np.where(second["valid"], second["wavelength"], np.nan), "nearest-neighbor")
    later_band = project(np.where(second["valid"], second["bandwidth"], np.nan), "nearest-neighbor")
    mask = (
        first["valid"] & np.isfinite(later_flux) & np.isfinite(later_wave) & np.isfinite(later_band)
        & (np.abs(first["wavelength"] - later_wave) <= 0.1 * np.minimum(first["bandwidth"], later_band))
        & (np.abs(first["bandwidth"] - later_band) <= 0.1 * np.minimum(first["bandwidth"], later_band))
    )
    x, y = first["wcs"].world_to_pixel_values(ra, dec)
    if not np.isfinite(x) or not np.isfinite(y):
        raise ValueError("Requested coordinate is not on the common WCS grid.")
    cx, cy = int(round(float(x))), int(round(float(y)))
    if not (0 <= cy < shape[0] and 0 <= cx < shape[1]) or not mask[cy, cx]:
        raise ValueError("The requested position does not have compatible valid pixels.")
    if np.count_nonzero(mask) < 100:
        raise ValueError("Fewer than 100 compatible, valid overlapping pixels.")

    # Check that both WCS solutions map the requested position back consistently.
    x2, y2 = second["wcs"].world_to_pixel_values(ra, dec)
    ra2, dec2 = second["wcs"].pixel_to_world_values(x2, y2)
    x_back, y_back = first["wcs"].world_to_pixel_values(ra2, dec2)
    if not np.all(np.isfinite([x2, y2, x_back, y_back])) or np.hypot(x_back - x, y_back - y) > 0.1:
        raise ValueError("WCS round-trip consistency check failed.")

    values = np.concatenate((first["data"][mask], later_flux[mask]))
    low, high = np.percentile(values, [1, 99])
    if not np.isfinite(low) or not np.isfinite(high) or high <= low:
        raise ValueError("Common display scale could not be calculated.")
    details = {
        "central_wavelength_microns": float(first["wavelength"][cy, cx]),
        "later_central_wavelength_microns": float(later_wave[cy, cx]),
        "central_bandwidth_microns": float(first["bandwidth"][cy, cx]),
        "valid_pixels": int(mask.sum()),
        "total_pixels": int(mask.size),
        "display_min_mjy_sr": float(low),
        "display_max_mjy_sr": float(high),
        "exposure_seconds": [first["exposure"], second["exposure"]],
        "calibration_ids": first["calibration_ids"],
        "pipeline_version": first["version"],
    }
    return first["data"], later_flux, mask, details


def write_png(path: Path, data: np.ndarray, mask: np.ndarray, low: float, high: float) -> None:
    scaled = np.zeros(data.shape, dtype=float)
    scaled[mask] = np.arcsinh(10 * np.clip((data[mask] - low) / (high - low), 0, 1)) / np.arcsinh(10)
    intensity = np.asarray(np.round(scaled * 255), dtype=np.uint8)
    rgba = np.stack((intensity, intensity, intensity, mask.astype(np.uint8) * 255), axis=-1)
    Image.fromarray(rgba).save(path, format="PNG")


def build(calibration_path: Path, directory: Path) -> dict:
    with calibration_path.open("rb") as calibration_file:
        if hashlib.file_digest(calibration_file, "sha256").hexdigest() != CALIBRATION_SHA256:
            raise ValueError("Calibration file checksum does not match the published product used by this script.")
    manifest_path = directory / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    region = manifest["regions"][0]
    saved = next(item for item in region["observations"] if item["observation"]["release"] == "spherex_dr1" and item["observation"]["detector"] == 3)
    earlier = saved["observation"]
    if earlier["calibration_level"] != 2:
        raise ValueError("The reference observation is not a Level 2 product.")
    ra, dec = region["ra_deg"], region["dec_deg"]
    result = search_observations(ra=ra, dec=dec, radius=0.01, collection="spherex_dr1", detector=3, max_results=120)
    candidates = sorted(
        (o for o in result.observations if o.observation_mjd > earlier["observation_mjd"] and o.observation_id != earlier["observation_id"]),
        key=lambda o: (o.ra_deg - earlier["ra_deg"]) ** 2 + (o.dec_deg - earlier["dec_deg"]) ** 2,
    )
    errors = []
    with fits.open(calibration_path, memmap=True) as calibration:
        first = read_cutout((directory / saved["fits_file"]).read_bytes(), calibration)
        for candidate in candidates[:12]:
            try:
                if candidate.calibration_level != earlier["calibration_level"]:
                    raise ValueError("Calibration levels differ.")
                payload = _download_cutout(candidate.access_url, ra, dec, 0.1)
                second = read_cutout(payload, calibration)
                before, after, mask, details = align_pair(first, second, ra, dec)
            except (HTTPException, OSError, KeyError, ValueError) as error:
                errors.append(f"{candidate.id}: {getattr(error, 'detail', str(error))}")
                continue
            prefix = f"comparison-{earlier['id']}-{candidate.id}"
            before_path, after_path = directory / f"{prefix}-before.png", directory / f"{prefix}-after.png"
            cutout_path = directory / f"spherex_dr1-{candidate.id}.fits"
            cutout_path.write_bytes(payload)
            write_png(before_path, before, mask, details["display_min_mjy_sr"], details["display_max_mjy_sr"])
            write_png(after_path, after, mask, details["display_min_mjy_sr"], details["display_max_mjy_sr"])
            pair = {
                "id": prefix, "earlier": earlier, "later": candidate.model_dump(),
                "before_image": before_path.name, "after_image": after_path.name,
                "later_cutout_file": cutout_path.name,
                "calibration_url": CALIBRATION_URL, "calibration_sha256": CALIBRATION_SHA256, "details": details,
                "method": "CWAVE/CBAND pixel screening; only SOURCE flag allowed; positive VARIANCE; FINAST=0; WCS nearest-neighbor reprojection; shared 1st-99th percentile asinh stretch",
                "limitations": "Visual inspection only; no PSF matching, zodiacal subtraction, or uncertainty propagation.",
            }
            region["comparisons"] = [pair]
            manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
            return pair
    raise RuntimeError("No compatible pair found. " + "; ".join(errors))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--calibration", type=Path, required=True, help=f"Local calibration downloaded from {CALIBRATION_URL}")
    parser.add_argument("--directory", type=Path, default=Path("public/observations"))
    args = parser.parse_args()
    pair = build(args.calibration, args.directory)
    print(json.dumps(pair, indent=2))


if __name__ == "__main__":
    main()
