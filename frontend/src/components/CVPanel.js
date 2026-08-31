import { useState } from 'react';
import usePolling from '../hooks/usePolling';
import { getBoat } from '../api/boat';
import { setHsvLower, setHsvUpper, setDetectionThreshold } from '../api/algo';
import { activateCV, setManualMode } from '../api/mission';

const BUOY_ALERT_DISTANCE = 2;

function parseTriplet(text) {
  const values = text.split(',').map((v) => parseInt(v.trim(), 10));
  if (values.length !== 3 || values.some(Number.isNaN)) {
    throw new Error('Enter 3 comma-separated integers, e.g. "0, 120, 180"');
  }
  return values;
}

export default function CVPanel() {
  const { data: boat } = usePolling(getBoat, 1000);
  const [hsvLower, setHsvLowerInput] = useState('');
  const [hsvUpper, setHsvUpperInput] = useState('');
  const [threshold, setThreshold] = useState('');
  const [status, setStatus] = useState(null);
  const [pending, setPending] = useState(false);

  const run = async (action) => {
    setPending(true);
    setStatus(null);
    try {
      const { message, ok } = await action();
      setStatus({ kind: 'ok', message: message || ok });
    } catch (err) {
      setStatus({ kind: 'error', message: err.message || err.response?.data?.error });
    } finally {
      setPending(false);
    }
  };

  const buoyDistance = boat?.buoyDistance;
  const buoyClose = Number.isFinite(buoyDistance) && buoyDistance <= BUOY_ALERT_DISTANCE;

  return (
    <div className="panel">
      <h2>Computer Vision</h2>

      <form className="add-form" onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const values = parseTriplet(hsvLower);
          const res = await setHsvLower(values);
          setHsvLowerInput('');
          return { ok: `HSV lower set to [${res.values.join(', ')}]` };
        });
      }}>
        <input type="text" placeholder="HSV lower, e.g. 0, 120, 180" value={hsvLower} onChange={(e) => setHsvLowerInput(e.target.value)} required />
        <button type="submit" disabled={pending}>Set</button>
      </form>

      <form className="add-form" onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const values = parseTriplet(hsvUpper);
          const res = await setHsvUpper(values);
          setHsvUpperInput('');
          return { ok: `HSV upper set to [${res.values.join(', ')}]` };
        });
      }}>
        <input type="text" placeholder="HSV upper, e.g. 10, 160, 255" value={hsvUpper} onChange={(e) => setHsvUpperInput(e.target.value)} required />
        <button type="submit" disabled={pending}>Set</button>
      </form>

      <form className="add-form" onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const res = await setDetectionThreshold(parseInt(threshold, 10));
          setThreshold('');
          return { ok: `Detection threshold set to ${res.value}` };
        });
      }}>
        <input type="number" placeholder="Detection threshold" value={threshold} onChange={(e) => setThreshold(e.target.value)} required />
        <button type="submit" disabled={pending}>Set</button>
      </form>

      <table className="stats-table">
        <tbody>
          <tr>
            <td>Buoy distance</td>
            <td>{Number.isFinite(buoyDistance) ? buoyDistance.toFixed(2) : 'N/A'}</td>
          </tr>
          <tr>
            <td>Within alert range (&le;{BUOY_ALERT_DISTANCE})</td>
            <td>{buoyClose ? 'True' : 'False'}</td>
          </tr>
        </tbody>
      </table>

      {buoyClose && (
        <img src="/red_flag.png" alt="Buoy proximity alert" className="red-flag-alert" />
      )}

      <div className="button-row">
        <button type="button" onClick={() => run(() => activateCV())} disabled={pending}>Activate CV</button>
        <button type="button" className="clear-button" onClick={() => run(() => setManualMode())} disabled={pending}>End CV</button>
      </div>

      {status && (
        <p className={status.kind === 'error' ? 'form-status form-status-error' : 'form-status form-status-ok'}>
          {status.message}
        </p>
      )}
    </div>
  );
}
