import { useState } from 'react';
import { sendManualControl } from '../api/boat';

// Manual actuator control through the backend.
export default function ManualControlPanel() {
  const [rudder, setRudder] = useState('');
  const [sail, setSail] = useState('');
  const [jib, setJib] = useState('');
  const [jibSide, setJibSide] = useState('0');
  const [status, setStatus] = useState(null); // { kind: 'ok' | 'error', message }

  const submit = async (field, value, reset) => {
    if (value === '') return;
    try {
      await sendManualControl({ [field]: parseFloat(value), ...(field === 'jib' ? { jibSide: Number(jibSide) } : {}) });
      setStatus({ kind: 'ok', message: `${field} set to ${value}°` });
      reset('');
    } catch (err) {
      setStatus({ kind: 'error', message: err.response?.data?.error || err.message });
    }
  };

  return (
    <div className="panel">
      <h2>Manual Control</h2>
      <form className="add-form" onSubmit={(e) => { e.preventDefault(); submit('rudder', rudder, setRudder); }}>
        <input type="number" step="any" placeholder="Rudder angle (°)" value={rudder} onChange={(e) => setRudder(e.target.value)} required />
        <button type="submit">Set rudder</button>
      </form>
      <form className="add-form" onSubmit={(e) => { e.preventDefault(); submit('sail', sail, setSail); }}>
        <input type="number" step="any" placeholder="Sail angle (°)" value={sail} onChange={(e) => setSail(e.target.value)} required />
        <button type="submit">Set sail</button>
      </form>
      <form className="add-form" onSubmit={(e) => { e.preventDefault(); submit('jib', jib, setJib); }}>
        <input aria-label="Jib angle (°)" type="number" min="0" max="90" step="1" placeholder="Jib angle (0–90°)" value={jib} onChange={(e) => setJib(e.target.value)} required />
        <select className="mode-select" style={{ width: 'auto' }} aria-label="Jib side" value={jibSide} onChange={(e) => setJibSide(e.target.value)}>
          <option value="0">Port</option>
          <option value="1">Starboard</option>
        </select>
        <button type="submit">Set jib</button>
      </form>
      {status && (
        <p className={status.kind === 'error' ? 'form-status form-status-error' : 'form-status form-status-ok'}>
          {status.message}
        </p>
      )}
    </div>
  );
}
