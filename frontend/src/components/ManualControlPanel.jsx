import { useState } from 'react';
import { sendManualControl } from '../api/boat';

// Manual rudder/sail override — mirrors the old dashboard's sail-input /
// rudder-input forms, which published straight to /sailbot/webserver_sail
// and /sailbot/webserver_rudder.
export default function ManualControlPanel() {
  const [rudder, setRudder] = useState('');
  const [sail, setSail] = useState('');
  const [status, setStatus] = useState(null); // { kind: 'ok' | 'error', message }

  const submit = async (field, value, reset) => {
    if (value === '') return;
    try {
      await sendManualControl({ [field]: parseFloat(value) });
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
      {status && (
        <p className={status.kind === 'error' ? 'form-status form-status-error' : 'form-status form-status-ok'}>
          {status.message}
        </p>
      )}
    </div>
  );
}
