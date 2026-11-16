import { useQuery } from "@tanstack/react-query";
import { searchObservations } from "../lib/api";
import { useExplorerStore } from "../store/useExplorerStore";
import { staticOnly } from "../lib/deployment";

export function useObservations() {
  const search = useExplorerStore((state) => state.search);
  const query = useQuery({
    queryKey: ["observations", search],
    queryFn: ({ signal }) => searchObservations(search, signal),
    enabled: !staticOnly,
  });

  return { search, query };
}
