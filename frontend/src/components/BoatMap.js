import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import usePolling from '../hooks/usePolling';
import { getBoat } from '../api/boat';
import { getWaypoints, addWaypoint, deleteWaypoint } from '../api/waypoints';
import { getBuoys, deleteBuoy } from '../api/buoys';

// Lake Quinsigamond, MA — same default center the old dashboard used.
const DEFAULT_CENTER = { lat: 42.276848, lng: -71.756323 };
const DEFAULT_ZOOM = 15;
const TRAIL_WINDOW_MS = 60_000;

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

// Muted, low-chroma basemap so the boat/waypoint/buoy markers stay legible.
const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#eef1f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9dcea' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

// These read window.google.maps, so they must only be called after the JS
// API has finished loading (isLoaded === true) — never at module scope.
function boatIcon(heading = 0) {
  return {
    path: 'M 0,-10 L 7,8 L 0,4 L -7,8 Z',
    fillColor: '#3a7ca5',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
    rotation: heading,
    scale: 1.3,
    anchor: new window.google.maps.Point(0, 0),
  };
}

function waypointIcon() {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: '#911084',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 6,
  };
}

function buoyIcon() {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: '#ffa500',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 5,
  };
}

export default function BoatMap() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'sailbot-google-map',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  });

  const { data: boat } = usePolling(getBoat, 1000);
  const { data: waypoints, refresh: refreshWaypoints } = usePolling(getWaypoints, 2000);
  const { data: buoys, refresh: refreshBuoys } = usePolling(getBuoys, 2000);

  const [trail, setTrail] = useState([]);
  const [openInfo, setOpenInfo] = useState(null); // { type, id }
  const [mousePos, setMousePos] = useState(null);
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

  const trailPositions = useMemo(() => trail.map((p) => ({ lat: p.lat, lng: p.lng })), [trail]);
  const waypointPath = useMemo(() => (waypoints ?? []).map((w) => ({ lat: w.latitude, lng: w.longitude })), [waypoints]);

  const handleAddWaypoint = useCallback(async (lat, lng) => {
    await addWaypoint(lat, lng, (waypoints ?? []).length);
    refreshWaypoints();
  }, [waypoints, refreshWaypoints]);

  const handleDeleteWaypoint = async (id) => {
    await deleteWaypoint(id);
    setOpenInfo(null);
    refreshWaypoints();
  };

  const handleDeleteBuoy = async (id) => {
    await deleteBuoy(id);
    setOpenInfo(null);
    refreshBuoys();
  };

  const onMapDblClick = useCallback((e) => {
    handleAddWaypoint(e.latLng.lat(), e.latLng.lng());
  }, [handleAddWaypoint]);

  const onMapMouseMove = useCallback((e) => {
    setMousePos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }, []);

  const boatPosition = boat && Number.isFinite(boat.latitude) && Number.isFinite(boat.longitude)
    ? { lat: boat.latitude, lng: boat.longitude }
    : null;

  return (
    <div className="panel map-panel">
      <div className="panel-header">
        <h2>Map <span className="hint">(double-click to add a waypoint)</span></h2>
        {mousePos && (
          <span className="mouse-pos">{mousePos.lat.toFixed(5)}, {mousePos.lng.toFixed(5)}</span>
        )}
      </div>

      <div className="map-container">
        {loadError && (
          <div className="map-fallback">Google Maps failed to load. Check REACT_APP_GOOGLE_MAPS_API_KEY.</div>
        )}
        {!loadError && !isLoaded && (
          <div className="map-fallback">Loading map…</div>
        )}
        {!loadError && isLoaded && (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={boatPosition ?? DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            onDblClick={onMapDblClick}
            onMouseMove={onMapMouseMove}
            options={{ styles: MAP_STYLE, streetViewControl: false, fullscreenControl: false, mapTypeControl: false }}
          >
            {boatPosition && (
              <Marker
                position={boatPosition}
                icon={boatIcon(boat.heading)}
                onClick={() => setOpenInfo({ type: 'boat' })}
              >
                {openInfo?.type === 'boat' && (
                  <InfoWindow onCloseClick={() => setOpenInfo(null)}>
                    <span>Sailboat<br />{boat.latitude.toFixed(6)}, {boat.longitude.toFixed(6)}</span>
                  </InfoWindow>
                )}
              </Marker>
            )}

            {trailPositions.length > 1 && (
              <Polyline path={trailPositions} options={{ strokeColor: '#d64545', strokeWeight: 2 }} />
            )}

            {waypointPath.length > 1 && (
              <Polyline path={waypointPath} options={{ strokeColor: '#911084', strokeWeight: 2 }} />
            )}

            {(waypoints ?? []).map((w) => (
              <Marker
                key={w._id}
                position={{ lat: w.latitude, lng: w.longitude }}
                icon={waypointIcon()}
                onClick={() => setOpenInfo({ type: 'waypoint', id: w._id })}
              >
                {openInfo?.type === 'waypoint' && openInfo.id === w._id && (
                  <InfoWindow onCloseClick={() => setOpenInfo(null)}>
                    <span>
                      Waypoint {w.order}<br />
                      {w.latitude.toFixed(6)}, {w.longitude.toFixed(6)}<br />
                      <button onClick={() => handleDeleteWaypoint(w._id)}>Delete</button>
                    </span>
                  </InfoWindow>
                )}
              </Marker>
            ))}

            {(buoys ?? []).map((b) => (
              <Marker
                key={b._id}
                position={{ lat: b.latitude, lng: b.longitude }}
                icon={buoyIcon()}
                onClick={() => setOpenInfo({ type: 'buoy', id: b._id })}
              >
                {openInfo?.type === 'buoy' && openInfo.id === b._id && (
                  <InfoWindow onCloseClick={() => setOpenInfo(null)}>
                    <span>
                      {b.name || 'Buoy'}<br />
                      {b.latitude.toFixed(6)}, {b.longitude.toFixed(6)}<br />
                      <button onClick={() => handleDeleteBuoy(b._id)}>Delete</button>
                    </span>
                  </InfoWindow>
                )}
              </Marker>
            ))}
          </GoogleMap>
        )}
      </div>
    </div>
  );
}
