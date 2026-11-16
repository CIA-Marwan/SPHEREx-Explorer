import pytest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request
from fastapi import HTTPException

from backend.main import _RejectCutoutRedirects, _as_observation, _cached_archive_csv, _render_cutout, _validate_fits_url, resolve_object, search_observations


def test_archive_row_preserves_real_metadata_and_converts_wavelength_units():
    observation = _as_observation(
        {
            "access_url": (
                "https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/"
                "level2/2025W18_1B/l2b-v27-2026-196/1/"
                "level2_2025W18_1B_0162_1D1_spx_l2b-v27-2026-196.fits"
            ),
            "energy_bandpassname": "SPHEREx-D1",
            "obs_id": "2025W18_1B_0162_1",
            "s_ra": "129.37188360599256",
            "s_dec": "-37.916895110615471",
            "t_min": "60794.593497",
            "em_min": "7.45500e-07",
            "em_max": "1.11670e-06",
            "calib_level": "2",
            "t_exptime": "113.582600",
        },
        "spherex_dr1",
    )

    assert observation is not None
    assert observation.observation_id == "2025W18_1B_0162_1"
    assert observation.detector == 1
    assert observation.observation_time_utc.startswith("2025-04-29")
    assert observation.wavelength_min_microns == pytest.approx(0.7455)
    assert observation.wavelength_max_microns == pytest.approx(1.1167)


def test_untrusted_or_non_archive_fits_urls_are_rejected():
    with pytest.raises(HTTPException) as error:
        _validate_fits_url("https://example.com/anything.fits")

    assert error.value.status_code == 422


@pytest.mark.parametrize("url", [
    "https://user@irsa.ipac.caltech.edu/ibe/data/spherex/example.fits",
    "https://irsa.ipac.caltech.edu:444/ibe/data/spherex/example.fits",
    "https://irsa.ipac.caltech.edu/ibe/data/spherex/%2e%2e/example.fits",
    "https://irsa.ipac.caltech.edu/ibe/data/spherex/example.fits#fragment",
    "https://[invalid/ibe/data/spherex/example.fits",
])
def test_archive_url_rejects_ambiguous_authorities_and_paths(url):
    with pytest.raises(HTTPException) as error:
        _validate_fits_url(url)
    assert error.value.status_code == 422


def test_cutout_redirects_cannot_reach_another_host():
    request = Request("https://irsa.ipac.caltech.edu/ibe/data/spherex/example.fits")
    with pytest.raises(HTTPError, match="redirects are not accepted"):
        _RejectCutoutRedirects().redirect_request(request, None, 302, "Found", {}, "http://127.0.0.1/")


def test_simbad_resolver_reports_object_type_not_morphology(monkeypatch):
    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

        def read(self, _limit):
            return (
                b"<Sesame><Target><Resolver><oname>M 31</oname>"
                b"<otype>AGN</otype><MType>SA(s)b</MType>"
                b"<jradeg>10.6847083</jradeg><jdedeg>41.26875</jdedeg>"
                b"</Resolver></Target></Sesame>"
            )

    monkeypatch.setattr("backend.main.urlopen", lambda *_args, **_kwargs: FakeResponse())

    result = resolve_object("M31")

    assert result["name"] == "M 31"
    assert result["object_type"] == "AGN"


def test_preview_pixel_scale_comes_from_spatial_wcs(monkeypatch):
    payload = (Path(__file__).resolve().parents[1] / "public/observations/spherex_dr1-2025W17_4B_0127_1-D3.fits").read_bytes()
    monkeypatch.setattr("backend.main._download_cutout", lambda *_args: payload)
    _render_cutout.cache_clear()
    try:
        _, metadata = _render_cutout("https://irsa.ipac.caltech.edu/ibe/data/spherex/example.fits", 127.69444, -39.1776, 0.1)
        assert float(metadata["pixel_scale_arcsec"]) == pytest.approx(6.15181, rel=1e-4)
    finally:
        _render_cutout.cache_clear()


def test_archive_search_cache_expires_between_ten_minute_windows(monkeypatch):
    calls = []
    now = [1200]
    monkeypatch.setattr("backend.main.time.time", lambda: now[0])
    monkeypatch.setattr("backend.main._read_archive_csv", lambda url: calls.append(url) or [])
    _cached_archive_csv.cache_clear()
    try:
        params = dict(ra=1.0, dec=2.0, radius=0.01, collection="spherex_dr1", detector=None, max_results=10)
        search_observations(**params)
        search_observations(**params)
        assert len(calls) == 1
        now[0] += 600
        search_observations(**params)
        assert len(calls) == 2
    finally:
        _cached_archive_csv.cache_clear()
