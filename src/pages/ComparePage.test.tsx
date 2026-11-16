import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ComparePage } from "./ComparePage";
import type { Observation } from "../types";

const state = vi.hoisted(() => ({ result: {} as object }));
vi.mock("../hooks/useObservationManifest", () => ({
  useObservationManifest: () => state.result,
}));

const observation = (id: string, mjd: number): Observation => ({
  id, observation_id: id, detector: 3, ra_deg: 127.69444, dec_deg: -39.1776,
  observation_mjd: mjd, observation_time_utc: "2025-04-29T14:14:38.121",
  wavelength_min_microns: 1.63, wavelength_max_microns: 2.43,
  calibration_level: 2, exposure_seconds: 113.58,
  access_url: "https://irsa.ipac.caltech.edu/ibe/data/spherex/example.fits",
  release: "spherex_dr1", archive_record_url: "https://irsa.ipac.caltech.edu/applications/spherex",
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ComparePage", () => {
  it("does not show a comparison when the manifest contains no validated pair", () => {
    state.result = { data: { regions: [] }, isPending: false, isError: false };
    render(<MemoryRouter><ComparePage /></MemoryRouter>);
    expect(screen.getByText(/No screened comparison pair is available/)).toBeInTheDocument();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("offers a keyboard slider, synchronized zoom, side-by-side and reset for a saved pair", () => {
    state.result = {
      isPending: false, isError: false,
      data: { regions: [{ id: "field", label: "Field", comparisons: [{
        id: "pair", earlier: observation("earlier", 60000), later: observation("later", 60001),
        before_image: "before.png", after_image: "after.png", calibration_url: "https://example.com",
        method: "calibrated", limitations: "Visual inspection only.",
        details: { central_wavelength_microns: 2.38, later_central_wavelength_microns: 2.38,
          central_bandwidth_microns: 0.06, valid_pixels: 200, total_pixels: 300 },
      }] }] },
    };
    render(<MemoryRouter><ComparePage /></MemoryRouter>);
    expect(screen.getByRole("combobox", { name: "Earlier observation" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Later observation" })).toBeDisabled();
    expect(screen.getByText(/Only one screened pair is available/)).toBeInTheDocument();
    const slider = screen.getByRole("slider", { name: /divider position/i });
    fireEvent.change(slider, { target: { value: "30" } });
    expect(slider).toHaveValue("30");
    fireEvent.click(screen.getByRole("button", { name: "Zoom in both images" }));
    expect(screen.getByText(/Zoom 1.4×/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Side by side" }));
    expect(screen.getByRole("button", { name: "Side by side" })).toHaveAttribute("aria-pressed", "true");
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Blink images" }));
    expect(screen.getByAltText(/^Earlier observation/)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1200));
    expect(screen.getByAltText(/^Later observation/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stop blinking" }));
    act(() => vi.advanceTimersByTime(1200));
    expect(screen.getByRole("slider", { name: /divider position/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset comparison" }));
    expect(screen.getByRole("slider", { name: /divider position/i })).toHaveValue("50");
    expect(screen.getByText(/Zoom 1.0×/)).toBeInTheDocument();
  });
});
