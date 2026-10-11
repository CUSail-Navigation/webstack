import { useRef, useState } from 'react';
import useWaypoints from '../hooks/useWaypoints';
import { addWaypoint, deleteWaypoint, reorderWaypoints, clearWaypoints } from '../api/waypoints';

export default function WaypointPanel() {
  const { waypoints, mutate, disabled, label, error } = useWaypoints();
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const dragIndex = useRef(null);
  const dragQueue = useRef(null);

  const list = waypoints ?? [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lat === '' || lng === '') return;
    if (await mutate(() => addWaypoint(parseFloat(lat), parseFloat(lng)))) {
      setLat('');
      setLng('');
    }
  };

  const handleDelete = async (id) => {
    await mutate(() => deleteWaypoint(id));
  };

  const handleClear = async () => {
    await mutate(clearWaypoints);
  };

  // Cancel the drop if polling changed the queue during the drag.
  const handleDragStart = (index) => {
    dragIndex.current = index;
    dragQueue.current = list.map((w) => w._id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (index) => {
    const from = dragIndex.current;
    const ids = dragQueue.current;
    dragIndex.current = null;
    dragQueue.current = null;
    if (disabled || from === null || from === index || !ids ||
        ids.length !== list.length || ids.some((id, i) => id !== list[i]._id)) return;

    const reordered = [...list];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);

    await mutate(() => reorderWaypoints(reordered.map((w) => w._id)));
  };

  return (
    <div className="panel">
      <h2>Waypoints</h2>
      <p role="status">{label}</p>
      {error && <p role="alert">{error}</p>}
      <form className="add-form" onSubmit={handleSubmit}>
        <input type="number" step="any" placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} required />
        <input type="number" step="any" placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} required />
        <button type="submit" disabled={disabled}>Add</button>
      </form>

      {list.length === 0 ? (
        <p className="empty-state">No waypoints queued. Add one above or double-click the map.</p>
      ) : (
        <ul className="item-list">
          {list.map((w, index) => (
            <li
              key={w._id}
              draggable={!disabled}
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              className="item-row"
            >
              <span className="drag-handle">⠿</span>
              <span className="item-coord">{w.latitude.toFixed(6)}, {w.longitude.toFixed(6)}</span>
              <button disabled={disabled} className="delete-button" onClick={() => handleDelete(w._id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      {list.length > 0 && (
        <button disabled={disabled} className="clear-button" onClick={handleClear}>Clear all</button>
      )}
    </div>
  );
}
