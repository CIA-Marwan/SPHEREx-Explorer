from __future__ import annotations

import csv
import io
import math
import re
import time
import xml.etree.ElementTree as ET
from functools import lru_cache
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener, urlopen

import numpy as np
from astropy.io import fits
from astropy.time import Time
from astropy.wcs import WCS
from astropy.wcs.utils import proj_plane_pixel_scales
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, Response
from PIL import Image
from pydantic import BaseModel

IRSA_SIA_URL = "https://irsa.ipac.caltech.edu/SIA"
IRSA_HOST = "irsa.ipac.caltech.edu"
MAX_CSV_BYTES = 12 * 1024 * 1024
MAX_CUTOUT_BYTES = 16 * 1024 * 1024
MAX_RESULTS = 500
ALLOWED_COLLECTIONS = {
    "spherex_dr1",
    "spherex_dr1_deep",
    "spherex_qr3",
    "spherex_qr3_deep",
}
DETECTOR_PATTERN = re.compile(r"SPHEREx-D([1-6])$")

app = FastAPI(
    title="SPHEREx Explorer API",
    description="A bounded proxy for NASA/IPAC SPHEREx archive search and FITS cutouts.",
    version="1.0.0",
)


class Observation(BaseModel):
    id: str
    observation_id: str
    detector: int
    ra_deg: float
    dec_deg: float
    observation_mjd: float
    observation_time_utc: str
    wavelength_min_microns: float | None
    wavelength_max_microns: float | None
    calibration_level: int | None
    exposure_seconds: float | None
    access_url: str
    release: str
    archive_record_url: str


class ObservationSearch(BaseModel):
    collection: str
    center_ra_deg: float
    center_dec_deg: float
    radius_deg: float
    count: int
    truncated: bool
    observations: list[Observation]


def _number(value: str | None) -> float | None:
    if not value:
        return None
    try:
        result = float(value)
    except ValueError:
        return None
    return result if math.isfinite(result) else None


def _read_archive_csv(url: str) -> list[dict[str, str]]:
    request = Request(url, headers={"User-Agent": "SPHEREx-Explorer/1.0"})
    try:
        with urlopen(request, timeout=60) as response:
            body = response.read(MAX_CSV_BYTES + 1)
    except (HTTPError, URLError, TimeoutError) as error:
        raise HTTPException(
            status_code=502,
            detail=f"The NASA/IPAC archive could not complete the search: {error}",
        ) from error

    if len(body) > MAX_CSV_BYTES:
        raise HTTPException(
            status_code=502,
            detail="The archive search response exceeded the size limit.",
        )

    try:
        rows = list(csv.DictReader(io.StringIO(body.decode("utf-8-sig"))))
    except (UnicodeDecodeError, csv.Error) as error:
        raise HTTPException(
            status_code=502,
            detail="The archive returned an unreadable CSV response.",
        ) from error

    if not rows and b"s_ra" not in body:
        raise HTTPException(
            status_code=502,
            detail="The archive returned no parseable observation table.",
        )
    return rows


@lru_cache(maxsize=32)
def _cached_archive_csv(url: str, _cache_epoch: int) -> tuple[dict[str, str], ...]:
    return tuple(_read_archive_csv(url))


def _as_observation(row: dict[str, str], collection: str) -> Observation | None:
    access_url = row.get("access_url", "")
    parsed_url = urlparse(access_url)
    detector_match = DETECTOR_PATTERN.fullmatch(row.get("energy_bandpassname", ""))
    observation_id = row.get("obs_id", "")
    ra = _number(row.get("s_ra"))
    dec = _number(row.get("s_dec"))
    mjd = _number(row.get("t_min"))

    if (
        not observation_id
        or not detector_match
        or ra is None
        or dec is None
        or mjd is None
        or parsed_url.scheme != "https"
        or parsed_url.hostname != IRSA_HOST
        or not parsed_url.path.startswith("/ibe/data/spherex/")
        or not parsed_url.path.endswith(".fits")
    ):
        return None

    try:
        observation_time = Time(mjd, format="mjd", scale="utc").isot
    except (TypeError, ValueError) as error:
        raise HTTPException(
            status_code=502,
            detail="The archive returned an invalid observation timestamp.",
        ) from error

    calibration = _number(row.get("calib_level"))
    exposure = _number(row.get("t_exptime"))
    wavelength_min = _number(row.get("em_min"))
    wavelength_max = _number(row.get("em_max"))

    return Observation(
        id=f"{observation_id}-D{detector_match.group(1)}",
        observation_id=observation_id,
        detector=int(detector_match.group(1)),
        ra_deg=ra,
        dec_deg=dec,
        observation_mjd=mjd,
        observation_time_utc=observation_time,
        wavelength_min_microns=(
            wavelength_min * 1_000_000 if wavelength_min is not None else None
        ),
        wavelength_max_microns=(
            wavelength_max * 1_000_000 if wavelength_max is not None else None
        ),
        calibration_level=int(calibration) if calibration is not None else None,
        exposure_seconds=exposure,
        access_url=access_url,
        release=collection,
        archive_record_url=(
            "https://irsa.ipac.caltech.edu/applications/spherex"
        ),
    )


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "archive": IRSA_SIA_URL}


@app.get("/api/observations", response_model=ObservationSearch)
def search_observations(
    ra: float = Query(127.69444, ge=0, lt=360),
    dec: float = Query(-39.17760, ge=-90, le=90),
    radius: float = Query(0.01, gt=0, le=0.1),
    collection: str = Query("spherex_dr1"),
    detector: int | None = Query(None, ge=1, le=6),
    max_results: int = Query(120, ge=1, le=MAX_RESULTS),
) -> ObservationSearch:
    if collection not in ALLOWED_COLLECTIONS:
        raise HTTPException(
            status_code=422,
            detail="Choose a searchable SPHEREx DR1 or QR3 collection.",
        )

    query_url = f"{IRSA_SIA_URL}?{urlencode({
        'COLLECTION': collection,
        'POS': f'circle {ra:.8f} {dec:.8f} {radius:.6f}',
        'RESPONSEFORMAT': 'CSV',
        'MAXREC': MAX_RESULTS,
    })}"
    rows = _cached_archive_csv(query_url, int(time.time() // 600))
    observations = [
        observation
        for row in rows
        if (observation := _as_observation(row, collection)) is not None
        and (detector is None or observation.detector == detector)
    ]
    observations.sort(
        key=lambda item: (item.observation_mjd, item.detector, item.observation_id)
    )
    truncated = len(observations) > max_results or len(rows) >= MAX_RESULTS
    observations = observations[:max_results]

    return ObservationSearch(
        collection=collection,
        center_ra_deg=ra,
        center_dec_deg=dec,
        radius_deg=radius,
        count=len(observations),
        truncated=truncated,
        observations=observations,
    )


@app.get("/api/objects/resolve")
def resolve_object(
    name: str = Query(..., min_length=1, max_length=80),
) -> dict[str, str | float | None]:
    normalized_name = " ".join(name.split())
    if not normalized_name or any(ord(char) < 32 for char in normalized_name):
        raise HTTPException(
            status_code=422,
            detail="Enter a SIMBAD object name without control characters.",
        )

    encoded_name = quote(normalized_name, safe="")
    resolver_url = (
        "https://cds.unistra.fr/cgi-bin/nph-sesame/-oxp/Simbad?"
        f"{encoded_name}"
    )
    request = Request(resolver_url, headers={"User-Agent": "SPHEREx-Explorer/1.0"})
    try:
        with urlopen(request, timeout=30) as response:
            body = response.read(1_000_001)
    except (HTTPError, URLError, TimeoutError) as error:
        raise HTTPException(
            status_code=502,
            detail=f"The SIMBAD name resolver could not complete the request: {error}",
        ) from error

    if len(body) > 1_000_000:
        raise HTTPException(
            status_code=502,
            detail="The SIMBAD response exceeded the size limit.",
        )

    try:
        root = ET.fromstring(body)
    except ET.ParseError as error:
        raise HTTPException(
            status_code=502,
            detail="SIMBAD returned an unreadable name-resolution response.",
        ) from error

    resolver = root.find(".//Resolver")
    if resolver is None:
        raise HTTPException(
            status_code=404,
            detail=f"SIMBAD could not resolve “{normalized_name}”.",
        )

    def field(name: str) -> str | None:
        element = resolver.find(name)
        value = element.text.strip() if element is not None and element.text else None
        return value or None

    canonical_name = field("oname") or normalized_name
    ra_deg = _number(field("jradeg"))
    dec_deg = _number(field("jdedeg"))
    if ra_deg is None or dec_deg is None:
        raise HTTPException(
            status_code=404,
            detail=f"SIMBAD did not return usable coordinates for “{normalized_name}”.",
        )

    return {
        "name": canonical_name,
        "ra_deg": ra_deg,
        "dec_deg": dec_deg,
        "object_type": field("otype"),
        "catalog": "SIMBAD",
        "catalog_url": (
            "https://simbad.cds.unistra.fr/simbad/sim-id?"
            f"{urlencode({'Ident': canonical_name})}"
        ),
    }


def _validate_fits_url(access_url: str) -> None:
    try:
        parsed_url = urlparse(access_url)
        port = parsed_url.port
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Invalid archive URL.") from error
    if (
        parsed_url.scheme != "https"
        or parsed_url.hostname != IRSA_HOST
        or parsed_url.username is not None
        or parsed_url.password is not None
        or port not in (None, 443)
        or not parsed_url.path.startswith("/ibe/data/spherex/")
        or not parsed_url.path.endswith(".fits")
        or ".." in parsed_url.path
        or "%" in parsed_url.path
        or parsed_url.query
        or parsed_url.fragment
    ):
        raise HTTPException(
            status_code=422,
            detail="Only direct FITS URLs returned by the SPHEREx archive are accepted.",
        )


class _RejectCutoutRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise HTTPError(req.full_url, code, "Archive cutout redirects are not accepted.", headers, fp)


@lru_cache(maxsize=8)
def _download_cutout(access_url: str, ra: float, dec: float, size: float) -> bytes:
    _validate_fits_url(access_url)
    def decimal(value: float, places: int) -> str:
        return f"{value:.{places}f}".rstrip("0").rstrip(".")

    cutout_url = (
        f"{access_url}?{urlencode({'center': f'{decimal(ra, 8)},{decimal(dec, 8)}', 'size': decimal(size, 4)}, safe=',')}"
    )
    request = Request(
        cutout_url,
        headers={"User-Agent": "SPHEREx-Explorer/1.0", "Accept": "application/fits"},
    )
    try:
        with build_opener(_RejectCutoutRedirects()).open(request, timeout=90) as response:
            payload = response.read(MAX_CUTOUT_BYTES + 1)
    except HTTPError as error:
        raise HTTPException(
            status_code=502,
            detail=f"The IRSA cutout service returned HTTP {error.code}.",
        ) from error
    except (URLError, TimeoutError) as error:
        raise HTTPException(
            status_code=502,
            detail=f"The IRSA cutout service could not be reached: {error}",
        ) from error

    if len(payload) > MAX_CUTOUT_BYTES:
        raise HTTPException(
            status_code=413,
            detail="The requested cutout exceeded the 16 MB safety limit.",
        )
    return payload


@lru_cache(maxsize=16)
def _render_cutout(access_url: str, ra: float, dec: float, size: float) -> tuple[bytes, dict[str, str]]:
    payload = _download_cutout(access_url, ra, dec, size)
    try:
        with fits.open(io.BytesIO(payload), memmap=False) as hdus:
            image_hdu = next(
                (hdu for hdu in hdus if hdu.name == "IMAGE" and hdu.data is not None),
                None,
            )
            if image_hdu is None:
                raise HTTPException(
                    status_code=422,
                    detail="This FITS product does not contain an IMAGE extension.",
                )
            image_data = np.asarray(image_hdu.data, dtype=np.float32)
            header = image_hdu.header.copy()
            spatial_wcs = WCS(header).celestial
            if spatial_wcs.pixel_n_dim != 2:
                raise ValueError("Missing two-dimensional celestial WCS.")
            pixel_scale = float(proj_plane_pixel_scales(spatial_wcs)[1]) * 3600
    except (OSError, ValueError, TypeError) as error:
        raise HTTPException(
            status_code=502,
            detail="IRSA returned a FITS file that could not be read.",
        ) from error

    if image_data.ndim != 2 or image_data.size > 2_000_000:
        raise HTTPException(
            status_code=422,
            detail="The FITS image is not a supported two-dimensional cutout.",
        )
    if not math.isfinite(pixel_scale) or pixel_scale <= 0:
        raise HTTPException(status_code=422, detail="The FITS image has an invalid spatial pixel scale.")

    finite = np.isfinite(image_data)
    if not finite.any():
        raise HTTPException(
            status_code=422,
            detail="The cutout contains no finite science pixels.",
        )

    lower, upper = np.percentile(image_data[finite], [1, 99])
    if not np.isfinite(lower) or not np.isfinite(upper) or upper <= lower:
        raise HTTPException(
            status_code=422,
            detail="A display stretch could not be calculated from this cutout.",
        )

    normalized = np.zeros(image_data.shape, dtype=np.float32)
    scaled = np.clip((image_data[finite] - lower) / (upper - lower), 0, 1)
    normalized[finite] = np.arcsinh(10 * scaled) / np.arcsinh(10)

    stops = np.array([0.0, 0.28, 0.55, 0.78, 1.0])
    colors = np.array(
        [
            [3, 7, 24],
            [34, 30, 112],
            [65, 100, 235],
            [213, 70, 223],
            [255, 202, 111],
        ],
        dtype=np.float32,
    )
    rgb = np.stack(
        [np.interp(normalized, stops, colors[:, channel]) for channel in range(3)],
        axis=-1,
    ).astype(np.uint8)
    rgb[~finite] = np.array([3, 7, 24], dtype=np.uint8)

    output = io.BytesIO()
    Image.fromarray(rgb, mode="RGB").save(output, format="PNG", optimize=True)
    metadata = {
        "date_obs": str(header.get("DATE-OBS", "")),
        "bunit": str(header.get("BUNIT", "")),
        "crval1": str(header.get("CRVAL1", "")),
        "crval2": str(header.get("CRVAL2", "")),
        "pixel_scale_arcsec": str(pixel_scale),
        "display_stretch": "asinh; 1st-99th percentile; visualization only",
    }
    return output.getvalue(), metadata


@app.get("/api/preview")
def get_preview(
    access_url: str = Query(..., min_length=1, max_length=2048),
    ra: float = Query(..., ge=0, lt=360),
    dec: float = Query(..., ge=-90, le=90),
    size: float = Query(0.1, gt=0, le=0.2),
) -> Response:
    _validate_fits_url(access_url)
    png, metadata = _render_cutout(access_url, round(ra, 8), round(dec, 8), round(size, 4))
    headers = {
        "Cache-Control": "public, max-age=600",
        "X-Content-Type-Options": "nosniff",
        "X-Image-Date-Obs": metadata["date_obs"],
        "X-Image-Bunit": metadata["bunit"],
        "X-Image-Crval1": metadata["crval1"],
        "X-Image-Crval2": metadata["crval2"],
        "X-Image-Pixel-Scale-Arcsec": metadata["pixel_scale_arcsec"],
        "X-Image-Display-Stretch": metadata["display_stretch"],
    }
    return Response(content=png, media_type="image/png", headers=headers)


@app.api_route("/{path:path}", methods=["GET", "HEAD"], include_in_schema=False)
def frontend(path: str) -> FileResponse:
    dist = (Path(__file__).resolve().parents[1] / "dist").resolve()
    if not (dist / "index.html").is_file():
        raise HTTPException(status_code=503, detail="Frontend build is unavailable. Run npm run build.")
    if path in {"", "explore", "compare", "objects", "timeline", "about"}:
        return FileResponse(dist / "index.html")
    candidate = (dist / path).resolve()
    if candidate.is_relative_to(dist) and candidate.is_file():
        return FileResponse(candidate)
    raise HTTPException(status_code=404, detail="File not found.")
