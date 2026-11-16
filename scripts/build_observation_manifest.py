"""Download bounded SPHEREx cutouts and write a reproducible observation manifest."""

from __future__ import annotations

import argparse
import io
import json
import sys
from pathlib import Path
from urllib.parse import urlencode

import numpy as np
from astropy.io import fits
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend.main import _download_cutout, _render_cutout, search_observations


REGION = {
    "id": "irsa-example",
    "label": "IRSA example field",
    "ra_deg": 127.69444,
    "dec_deg": -39.17760,
    "source": "https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/",
}


def build_manifest(output: Path, limit: int) -> dict:
    output.mkdir(parents=True, exist_ok=True)
    entries = []
    errors = []
    for collection in ("spherex_dr1", "spherex_qr3"):
        try:
            result = search_observations(
                ra=REGION["ra_deg"], dec=REGION["dec_deg"], radius=0.01,
                collection=collection, detector=None, max_results=min(30, limit * 10),
            )
        except HTTPException as error:
            errors.append(f"{collection}: {error.detail}")
            continue
        for observation in result.observations:
            if len([item for item in entries if item["observation"]["release"] == collection]) >= limit:
                break
            try:
                payload = _download_cutout(observation.access_url, REGION["ra_deg"], REGION["dec_deg"], 0.1)
                png, _ = _render_cutout(observation.access_url, REGION["ra_deg"], REGION["dec_deg"], 0.1)
                with fits.open(io.BytesIO(payload), memmap=False) as hdus:
                    image = hdus["IMAGE"]
                    data = np.asarray(image.data)
                    if data.ndim != 2 or not np.isfinite(data).any():
                        raise ValueError("IMAGE is not a finite 2D array")
                    date_obs = str(image.header.get("DATE-OBS", ""))
                    unit = str(image.header.get("BUNIT", ""))
                    shape = list(data.shape)
                    extensions = [hdu.name for hdu in hdus]
            except (HTTPException, OSError, ValueError, KeyError) as error:
                errors.append(f"{observation.id}: {getattr(error, 'detail', str(error))}")
                continue
            stem = f"{collection}-{observation.id}"
            fits_path = output / f"{stem}.fits"
            png_path = output / f"{stem}.png"
            fits_path.write_bytes(payload)
            png_path.write_bytes(png)
            entries.append({
                "observation": observation.model_dump(),
                "cutout_url": observation.access_url + "?" + urlencode({
                    "center": f"{REGION['ra_deg']:.8f},{REGION['dec_deg']:.8f}", "size": "0.1000"
                }),
                "fits_file": fits_path.name,
                "image_file": png_path.name,
                "fits_date_obs": date_obs,
                "fits_bunit": unit,
                "image_shape": shape,
                "extensions": extensions,
                "processing": "IMAGE HDU; finite pixels; 1st-99th percentile asinh stretch; false-colour PNG",
                "wavelength_note": "SIA detector range only; wavelength varies across the image.",
            })
    if not entries:
        raise RuntimeError("No cutouts could be downloaded: " + "; ".join(errors))
    manifest = {"version": 1, "regions": [{**REGION, "observations": entries}], "errors": errors}
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("public/observations"))
    parser.add_argument("--per-collection", type=int, default=1, choices=range(1, 6))
    args = parser.parse_args()
    manifest = build_manifest(args.output, args.per_collection)
    for item in manifest["regions"][0]["observations"]:
        observation = item["observation"]
        print(f"{observation['release']} {observation['observation_time_utc']} "
              f"D{observation['detector']} {observation['wavelength_min_microns']}–"
              f"{observation['wavelength_max_microns']} µm\n"
              f"  source: {observation['access_url']}\n  image: {args.output / item['image_file']}")
    for error in manifest["errors"]:
        print(f"Warning: {error}", file=sys.stderr)


if __name__ == "__main__":
    main()
