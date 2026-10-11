import { useCallback, useRef, useState } from 'react';
import usePolling from './usePolling';
import { getWaypoints, getWaypointStatus } from '../api/waypoints';

async function fetchQueue() {
  const [waypoints, status] = await Promise.all([getWaypoints(), getWaypointStatus()]);
  return { waypoints, status };
}

export default function useWaypoints() {
  const { data, error, refresh } = usePolling(fetchQueue, 2000);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const editing = useRef(false);
  const status = data?.status;
  const stale = Boolean(error || !status?.connected || status.stale || !status.confirmedAt ||
    Date.now() - new Date(status.confirmedAt).getTime() > 5000);
  const label = !status?.confirmedAt ? 'Boat queue unavailable — no confirmed snapshot' :
    `Last confirmed queue — ${stale ? 'stale / offline; editing disabled' : 'up to date'}`;
  const mutate = useCallback(async (operation) => {
    if (stale || editing.current) return false;
    editing.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const result = await operation();
      setMessage(result?.warning || null);
      return true;
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
      return false;
    } finally {
      await refresh();
      editing.current = false;
      setBusy(false);
    }
  }, [stale, refresh]);
  return { waypoints: data?.waypoints ?? [], mutate, disabled: stale || busy, label,
    error: message || error?.message };
}
