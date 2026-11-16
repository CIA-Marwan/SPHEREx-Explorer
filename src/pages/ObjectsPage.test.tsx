import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { ObjectsPage } from "./ObjectsPage";

vi.mock("../lib/api", () => ({
  resolveCatalogObject: async (name: string) => ({
    name,
    ra_deg: 10,
    dec_deg: 20,
    object_type: name === "First" ? "Star" : "Galaxy",
    catalog: "SIMBAD",
    catalog_url: "https://simbad.cds.unistra.fr/",
  }),
}));

afterEach(cleanup);

it("filters only objects resolved in this session by their returned type and name", async () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter><ObjectsPage /></MemoryRouter></QueryClientProvider>);
  const query = screen.getByLabelText("Catalog object name");
  fireEvent.change(query, { target: { value: "First" } });
  fireEvent.click(screen.getByRole("button", { name: "Resolve name" }));
  await screen.findByRole("heading", { name: "First" });
  fireEvent.change(query, { target: { value: "Second" } });
  fireEvent.click(screen.getByRole("button", { name: "Resolve name" }));
  await screen.findByRole("heading", { name: "Second" });

  fireEvent.change(screen.getByLabelText("SIMBAD type code"), { target: { value: "Star" } });
  expect(screen.getByRole("heading", { name: "First" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Second/ })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Filter resolved names"), { target: { value: "missing" } });
  expect(screen.getByText("No resolved objects match these filters.")).toBeInTheDocument();
});
