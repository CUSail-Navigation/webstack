# Sailbot Dashboard (Frontend)

React dashboard for the sailbot: live telemetry, a Google Maps view of the
boat/waypoints/buoys, and full manual control (rudder/sail override, mode
switching, station keeping, algorithm tuning, computer-vision tuning). It
talks to the Express backend in `../backend`, which in turn talks to the
boat over `rosbridge`.

## 1. Prerequisites

- Node.js (v18+) and npm
- MongoDB running locally at `mongodb://127.0.0.1:27017` (the backend
  connects to a `sailbot` database there — see `../backend/src/config/db.js`)
- A `rosbridge_server` reachable from the backend (default
  `ws://localhost:9090`) if you want live boat data instead of an empty
  dashboard
- A Google Maps JavaScript API key (Maps JavaScript API enabled on it) —
  the map won't render without one

## 2. One-time setup

```bash
# from src/webserver/backend
npm install

# from src/webserver/frontend
npm install
```

Add your Google Maps key to `src/webserver/frontend/.env`:

```
REACT_APP_GOOGLE_MAPS_API_KEY=your-key-here
```

(`.env` is gitignored — `.env.example` documents the variable name for
anyone else setting this up.)

## 3. Running it

Start the backend first (it owns the ROS/Mongo connections and serves the
REST API on port 5000):

```bash
cd src/webserver/backend
ROSBRIDGE_URL=ws://localhost:9090 npm start
```

`ROSBRIDGE_URL` is optional — it defaults to `ws://localhost:9090`. You can
also change it at runtime from the dashboard itself (see "ROS connection"
below) without restarting the backend.

Then, in a second terminal, start the frontend dev server:

```bash
cd src/webserver/frontend
npm start
```

This opens `http://localhost:3000`. In development, CRA's proxy (see the
`proxy` field in `package.json`) forwards any `/api/*` request to the
backend at `localhost:5000`, so you don't need to configure CORS or hosts
by hand.

To run against a real boat/robot, point `ROSBRIDGE_URL` (or the runtime
connect field) at the boat's rosbridge address instead of localhost.

## 4. What's on the dashboard

**Header**
- Connection status dot + current rosbridge URL.
- A "connect" field to repoint the backend at a different rosbridge URL at
  runtime (e.g. switching between a simulator and the real boat) without
  restarting anything.

**Map** (main column)
- Boat position with heading, a 60-second position trail, waypoints, and
  buoys, all on Google Maps.
- Double-click the map to add a waypoint at that point.
- Click any marker for details / a delete button.
- Live mouse lat/lng readout while hovering the map.

**Telemetry** (main column)
- Heading / rudder / sail gauges.
- Wind angle, control mode, event mode, tacking state, distance to
  destination, target vs. radio vs. algo rudder/sail angles, dropped
  packet count.

**Station Keeping** (main column)
- Enter 4 corner lat/lng pairs and hit "Activate Station Keeping" to hold
  position in that rectangle, or "End" to return to manual mode.

**Computer Vision** (main column)
- HSV lower/upper color thresholds (3 comma-separated ints each) and a
  detection threshold, each published live to the vision node.
- Buoy distance readout with a proximity alert (flag icon) once the boat
  gets within 2 units of a tracked buoy.
- Activate/End CV search mode.

**Control Mode** (side column)
- Switch between Algo / Radio / Webserver / Controller App control modes.

**Manual Control** (side column)
- Directly command a rudder or sail angle from the browser (bypasses the
  algorithm entirely — useful for bench testing).

**Zone Config** (side column)
- Tune the no-go zone, neutral zone, and tacking buffer angles.

**Waypoints / Buoys** (side column)
- Add, delete, and drag-to-reorder waypoints; add/delete buoys. Both are
  persisted in MongoDB via the backend, independent of ROS connectivity.

## 5. Building for production

```bash
npm run build
```

Serve the resulting `build/` folder from the backend's Express app (or any
static host) with the backend's `/api` routes reachable from the same
origin, since there's no CRA proxy outside of `npm start`.

## 6. Troubleshooting

- **Map is blank / console shows a Google Maps auth error** — check
  `REACT_APP_GOOGLE_MAPS_API_KEY` in `.env` and that the key has the Maps
  JavaScript API enabled.
- **Status dot stays red** — the backend isn't connected to rosbridge.
  Confirm rosbridge is running at the URL shown next to the status dot, or
  use the header's connect field to point at the right one.
- **Waypoints/buoys don't save** — the backend can't reach MongoDB; check
  it's running locally on the default port.
