import { useState } from 'react';
import usePolling from '../hooks/usePolling';
import { getBuoys, addBuoy, deleteBuoy } from '../api/buoys';

export default function BuoyPanel() {
  const { data: buoys, refresh } = usePolling(getBuoys, 2000);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const list = buoys ?? [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lat === '' || lng === '') return;
    await addBuoy(parseFloat(lat), parseFloat(lng));
    setLat('');
    setLng('');
    refresh();
  };

  const handleDelete = async (id) => {
    await deleteBuoy(id);
    refresh();
  };

  return (
    <div className="panel">
      <h2>Buoys</h2>
      <form className="add-form" onSubmit={handleSubmit}>
        <input type="number" step="any" placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} required />
        <input type="number" step="any" placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} required />
        <button type="submit">Add</button>
      </form>

      {list.length === 0 ? (
        <p className="empty-state">No buoys marked. Add one above.</p>
      ) : (
        <ul className="item-list">
          {list.map((b) => (
            <li key={b._id} className="item-row">
              <span className="item-coord">{b.name ? `${b.name} — ` : ''}{b.latitude.toFixed(6)}, {b.longitude.toFixed(6)}</span>
              <button className="delete-button" onClick={() => handleDelete(b._id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
