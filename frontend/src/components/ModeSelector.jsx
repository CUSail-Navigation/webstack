import { useState } from 'react';
import usePolling from '../hooks/usePolling';
import { getBoat, setControlMode } from '../api/boat';

const MODES = [
  { value: 'algo', label: 'Algo' },
  { value: 'radio', label: 'Radio' },
  { value: 'webserver', label: 'Webserver' },
  { value: 'controller_app', label: 'Controller App' },
];

// Replaces the old dropdown-button UI — a plain <select> publishing to
// /sailbot/control_mode via POST /api/boat/mode.
export default function ModeSelector() {
  const { data: boat } = usePolling(getBoat, 2000);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const currentMode = boat?.controlMode ?? '';

  const handleChange = async (e) => {
    const mode = e.target.value;
    if (!mode) return;
    setPending(true);
    setError(null);
    try {
      await setControlMode(mode);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="panel">
      <h2>Control Mode</h2>
      <select className="mode-select" value={currentMode} onChange={handleChange} disabled={pending}>
        <option value="" disabled>Select mode…</option>
        {MODES.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      {error && <p className="form-status form-status-error">{error}</p>}
    </div>
  );
}
