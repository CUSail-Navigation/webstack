import { useCallback, useEffect, useRef, useState } from 'react';

// Calls `fetcher` immediately, then again every `intervalMs`, and keeps the
// latest resolved value in state. Returns a `refresh` function too, so a
// component can force an immediate re-fetch right after it POSTs/DELETEs
// something (e.g. adding a waypoint) instead of waiting for the next tick.
export default function usePolling(fetcher, intervalMs = 2000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { data, error, refresh };
}
