import { useRef, useState } from 'react';
import usePolling from '../hooks/usePolling';
import { getWaypoints, addWaypoint, deleteWaypoint, reorderWaypoints, clearWaypoints } from '../api/waypoints';

export default function WaypointPanel() {
  const { data: waypoints, refresh } = usePolling(getWaypoints, 2000);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const dragIndex = useRef(null);

  const list = waypoints ?? [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lat === '' || lng === '') return;
    await addWaypoint(parseFloat(lat), parseFloat(lng), list.length);
    setLat('');
    setLng('');
    refresh();
  };

  const handleDelete = async (id) => {
    await deleteWaypoint(id);
    refresh();
  };

  const handleClear = async () => {
    await clearWaypoints();
    refresh();
  };

  // Drag-and-drop reorder: reorder the ids client-side for instant feedback,
  // then persist the new order with a single PUT /waypoints/reorder call.
  const handleDragStart = (index) => {
    dragIndex.current = index;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (index) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === index) return;

    const reordered = [...list];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);

    await reorderWaypoints(reordered.map((w) => w._id));
    refresh();
  };

  return (
    <div className="panel">
      <h2>Waypoints</h2>
      <form className="add-form" onSubmit={handleSubmit}>
        <input type="number" step="any" placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} required />
        <input type="number" step="any" placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} required />
        <button type="submit">Add</button>
      </form>

      {list.length === 0 ? (
        <p className="empty-state">No waypoints queued. Add one above or double-click the map.</p>
      ) : (
        <ul className="item-list">
          {list.map((w, index) => (
            <li
              key={w._id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              className="item-row"
            >
              <span className="drag-handle">⠿</span>
              <span className="item-coord">{w.latitude.toFixed(6)}, {w.longitude.toFixed(6)}</span>
              <button className="delete-button" onClick={() => handleDelete(w._id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      {list.length > 0 && (
        <button className="clear-button" onClick={handleClear}>Clear all</button>
      )}
    </div>
  );
}
