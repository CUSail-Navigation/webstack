import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import usePolling from '../hooks/usePolling';
import { getBoat } from '../api/boat';
import { getWaypoints, addWaypoint, deleteWaypoint } from '../api/waypoints';
import { getBuoys, deleteBuoy } from '../api/buoys';

// Lake Quinsigamond, MA — same default center the old dashboard used.
const DEFAULT_CENTER = [42.276848, -71.756323];
const DEFAULT_ZOOM = 15;
const TRAIL_WINDOW_MS = 60_000;

// divIcon markers instead of image files: no marker-icon.png bundling
// headaches with webpack, and each one is just a small inline SVG/CSS shape.
function boatIcon(heading = 0) {
  return L.divIcon({
    className: 'boat-marker',
    html: `<div style="transform: rotate(${heading}deg)">▲</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const waypointIcon = L.divIcon({
  className: 'waypoint-marker',
  html: '<div></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const buoyIcon = L.divIcon({
  className: 'buoy-marker',
  html: '<div></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// react-leaflet has no declarative "onDoubleClick" prop on MapContainer;
// double-click-to-add-waypoint has to be wired up via this map-events hook,
// rendered as an invisible child of MapContainer.
function AddWaypointOnDoubleClick({ onAdd }) {
  useMapEvents({
    dblclick(e) {
      onAdd(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function BoatMap() {
  const { data: boat } = usePolling(getBoat, 1000);
  const { data: waypoints, refresh: refreshWaypoints } = usePolling(getWaypoints, 2000);
  const { data: buoys, refresh: refreshBuoys } = usePolling(getBuoys, 2000);

  const [trail, setTrail] = useState([]);
  const lastLoggedPos = useRef(null);

  // Build a client-side trail of the boat's last 60s of positions. The
  // backend only stores the *current* boat state (findOneAndUpdate with
  // upsert), not history, so the trail has to live in the browser.
  useEffect(() => {
    if (!boat || !Number.isFinite(boat.latitude) || !Number.isFinite(boat.longitude)) return;
    const last = lastLoggedPos.current;
    if (last && last.lat === boat.latitude && last.lng === boat.longitude) return;

    lastLoggedPos.current = { lat: boat.latitude, lng: boat.longitude };
    const now = Date.now();
    setTrail((prev) => [...prev, { lat: boat.latitude, lng: boat.longitude, t: now }].filter((p) => now - p.t <= TRAIL_WINDOW_MS));
  }, [boat]);

  const trailPositions = useMemo(() => trail.map((p) => [p.lat, p.lng]), [trail]);
  const waypointPath = useMemo(() => (waypoints ?? []).map((w) => [w.latitude, w.longitude]), [waypoints]);

  const handleAddWaypoint = async (lat, lng) => {
    await addWaypoint(lat, lng, (waypoints ?? []).length);
    refreshWaypoints();
  };

  const handleDeleteWaypoint = async (id) => {
    await deleteWaypoint(id);
    refreshWaypoints();
  };

  const handleDeleteBuoy = async (id) => {
    await deleteBuoy(id);
    refreshBuoys();
  };

  const boatPosition = boat && Number.isFinite(boat.latitude) && Number.isFinite(boat.longitude)
    ? [boat.latitude, boat.longitude]
    : null;

  return (
    <div className="panel map-panel">
      <h2>Map <span className="hint">(double-click to add a waypoint)</span></h2>
      <MapContainer center={boatPosition ?? DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="map-container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AddWaypointOnDoubleClick onAdd={handleAddWaypoint} />

        {boatPosition && (
          <Marker position={boatPosition} icon={boatIcon(boat.heading)}>
            <Popup>Sailboat<br />{boat.latitude.toFixed(6)}, {boat.longitude.toFixed(6)}</Popup>
          </Marker>
        )}

        {trailPositions.length > 1 && (
          <Polyline positions={trailPositions} pathOptions={{ color: '#d64545', weight: 2 }} />
        )}

        {waypointPath.length > 1 && (
          <Polyline positions={waypointPath} pathOptions={{ color: '#911084', weight: 2 }} />
        )}

        {(waypoints ?? []).map((w) => (
          <Marker
            key={w._id}
            position={[w.latitude, w.longitude]}
            icon={waypointIcon}
            eventHandlers={{ click: () => handleDeleteWaypoint(w._id) }}
          >
            <Popup>Waypoint {w.order}<br />{w.latitude.toFixed(6)}, {w.longitude.toFixed(6)}<br /><em>click marker to delete</em></Popup>
          </Marker>
        ))}

        {(buoys ?? []).map((b) => (
          <Marker
            key={b._id}
            position={[b.latitude, b.longitude]}
            icon={buoyIcon}
            eventHandlers={{ click: () => handleDeleteBuoy(b._id) }}
          >
            <Popup>{b.name || 'Buoy'}<br />{b.latitude.toFixed(6)}, {b.longitude.toFixed(6)}<br /><em>click marker to delete</em></Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
