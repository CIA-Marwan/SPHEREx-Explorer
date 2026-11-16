import type {
  ObservationSearch,
  ResolvedObject,
  SearchRequest,
} from "../types";

async function responseError(response: Response): Promise<Error> {
  let message = `Request failed (${response.status})`;
  try {
    const body = (await response.json()) as { detail?: string };
    if (body.detail) message = body.detail;
  } catch {
    // Keep the HTTP status when the server does not return JSON.
  }
  return new Error(message);
}

export async function searchObservations(
  request: SearchRequest,
  signal?: AbortSignal,
): Promise<ObservationSearch> {
  const params = new URLSearchParams({
    ra: String(request.ra),
    dec: String(request.dec),
    radius: String(request.radius),
    collection: request.collection,
    max_results: "120",
  });
  if (request.detector) params.set("detector", String(request.detector));

  const response = await fetch(`/api/observations?${params}`, { signal });
  if (!response.ok) throw await responseError(response);
  return (await response.json()) as ObservationSearch;
}

export async function resolveCatalogObject(
  name: string,
  signal?: AbortSignal,
): Promise<ResolvedObject> {
  const response = await fetch(
    `/api/objects/resolve?${new URLSearchParams({ name })}`,
    { signal },
  );
  if (!response.ok) throw await responseError(response);
  return (await response.json()) as ResolvedObject;
}

export function previewUrl(
  accessUrl: string,
  ra: number,
  dec: number,
  size = 0.1,
): string {
  return `/api/preview?${new URLSearchParams({
    access_url: accessUrl,
    ra: String(ra),
    dec: String(dec),
    size: String(size),
  })}`;
}
