import { useState } from 'react';
import { activateStationKeeping, setManualMode } from '../api/mission';

const EMPTY_CORNERS = [
  { lat: '', lng: '' },
  { lat: '', lng: '' },
  { lat: '', lng: '' },
  { lat: '', lng: '' },
];

// 4-corner rectangle -> POST /api/mission/station-keeping, which calls the
// /sailbot/set_mode service with mode "station_keeping". "End" calls the
// same service with mode "manual".
export default function StationKeepingPanel() {
  const [corners, setCorners] = useState(EMPTY_CORNERS);
  const [status, setStatus] = useState(null);
  const [pending, setPending] = useState(false);

  const updateCorner = (index, axis, value) => {
    setCorners((prev) => prev.map((c, i) => (i === index ? { ...c, [axis]: value } : c)));
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    const parsed = corners.map((c) => ({ latitude: parseFloat(c.lat), longitude: parseFloat(c.lng) }));
    if (parsed.some((c) => !Number.isFinite(c.latitude) || !Number.isFinite(c.longitude))) {
      setStatus({ kind: 'error', message: 'All 4 corners need numeric latitude/longitude' });
      return;
    }
    setPending(true);
    try {
      const result = await activateStationKeeping(parsed);
      setStatus({ kind: 'ok', message: result.message || 'Station keeping activated' });
    } catch (err) {
      setStatus({ kind: 'error', message: err.response?.data?.error || err.message });
    } finally {
      setPending(false);
    }
  };

  const handleEnd = async () => {
    setPending(true);
    try {
      const result = await setManualMode();
      setStatus({ kind: 'ok', message: result.message || 'Back to manual mode' });
    } catch (err) {
      setStatus({ kind: 'error', message: err.response?.data?.error || err.message });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="panel">
      <h2>Station Keeping</h2>
      <form onSubmit={handleActivate}>
        {corners.map((c, i) => (
          <div className="add-form" key={i}>
            <input
              type="number" step="any" placeholder={`Corner ${i + 1} lat`}
              value={c.lat} onChange={(e) => updateCorner(i, 'lat', e.target.value)} required
            />
            <input
              type="number" step="any" placeholder={`Corner ${i + 1} lng`}
              value={c.lng} onChange={(e) => updateCorner(i, 'lng', e.target.value)} required
            />
          </div>
        ))}
        <div className="button-row">
          <button type="submit" disabled={pending}>Activate Station Keeping</button>
          <button type="button" className="clear-button" onClick={handleEnd} disabled={pending}>
            End (Manual Mode)
          </button>
        </div>
      </form>
      {status && (
        <p className={status.kind === 'error' ? 'form-status form-status-error' : 'form-status form-status-ok'}>
          {status.message}
        </p>
      )}
    </div>
  );
}
