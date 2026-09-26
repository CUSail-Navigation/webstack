import { useState } from 'react';
import { setNoGoZone, setNeutralZone, setTackingBuffer } from '../api/algo';

const FIELDS = [
  { key: 'noGoZone', label: 'No-go zone (°)', submit: setNoGoZone },
  { key: 'neutralZone', label: 'Neutral zone (°)', submit: setNeutralZone },
  { key: 'tackingBuffer', label: 'Tacking buffer (°)', submit: setTackingBuffer },
];

// Algorithm tuning parameters — no-go zone / neutral zone / tacking buffer.
export default function ZoneConfigPanel() {
  const [values, setValues] = useState({});
  const [status, setStatus] = useState(null);

  const handleSubmit = async (field, e) => {
    e.preventDefault();
    const raw = values[field.key];
    if (raw === undefined || raw === '') return;
    try {
      await field.submit(parseInt(raw, 10));
      setStatus({ kind: 'ok', message: `${field.label} set to ${raw}` });
      setValues((prev) => ({ ...prev, [field.key]: '' }));
    } catch (err) {
      setStatus({ kind: 'error', message: err.response?.data?.error || err.message });
    }
  };

  return (
    <div className="panel">
      <h2>Zone Config</h2>
      {FIELDS.map((field) => (
        <form key={field.key} className="add-form" onSubmit={(e) => handleSubmit(field, e)}>
          <input
            type="number"
            step="1"
            placeholder={field.label}
            value={values[field.key] ?? ''}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
            required
          />
          <button type="submit">Submit</button>
        </form>
      ))}
      {status && (
        <p className={status.kind === 'error' ? 'form-status form-status-error' : 'form-status form-status-ok'}>
          {status.message}
        </p>
      )}
    </div>
  );
}
