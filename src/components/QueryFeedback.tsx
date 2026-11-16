import { AlertCircle, LoaderCircle } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ObservationSearch } from "../types";

export function QueryFeedback({
  query,
}: {
  query: UseQueryResult<ObservationSearch, Error>;
}) {
  if (query.isPending) {
    return (
      <div className="notice notice-loading" role="status">
        <LoaderCircle className="spin" size={18} aria-hidden="true" />
        <span>Searching NASA/IPAC for available observations…</span>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="notice notice-error" role="alert">
        <AlertCircle size={19} aria-hidden="true" />
        <div>
          <strong>Archive search failed</strong>
          <p>{query.error.message}</p>
          <p className="muted">Check your connection and retry. If running locally, confirm the API is running. No demonstration data is substituted.</p>
        </div>
        <button className="button button-secondary" onClick={() => void query.refetch()}>Retry</button>
      </div>
    );
  }

  if (!query.data.observations.length) {
    return (
      <div className="notice notice-empty" role="status">
        No matching SPHEREx observations were returned for this position and release. Try a wider radius, another detector, or another region.
      </div>
    );
  }

  return null;
}
