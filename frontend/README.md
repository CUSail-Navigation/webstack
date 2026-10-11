# Webstack Dashboard (Frontend)

React dashboard for the boat: live telemetry, a Google Maps view of the
boat/waypoints/buoys, and full manual control (rudder/sail override, mode
switching, station keeping, algorithm tuning, computer-vision tuning). It
talks to the Express backend in `../backend`, which in turn talks to the
boat over `rosbridge`.

## 1. Prerequisites

- Node.js 22.22.2+, 24.15.0+, or 26+ and npm
- MongoDB running locally at `mongodb://127.0.0.1:27017` (the backend
  defaults to a `webstack` database there; override with `MONGODB_URI` — see
  `../backend/src/config/db.js`).
- A ROS 2 stack with `rosbridge_server` running, reachable from the backend
  (default `ws://localhost:9090`) if you want live boat data instead of an
  empty dashboard — see "Connecting to ROS 2" below
- A Google Maps JavaScript API key — the map won't render without one, see
  "Google Maps setup" below

## 2. One-time setup

```bash
# from backend/
npm install

# from frontend/
npm install
```

Create `frontend/.env` with your Google Maps key:

```
VITE_GOOGLE_MAPS_API_KEY=your-key-here
```

Follow the format in `frontend/.env.example`. `.env` is gitignored, so this
step is per-machine — see "Google Maps setup" below for how to get a key.

## 3. Connecting to ROS 2

The backend is the only thing that talks to ROS — it connects to a
`rosbridge_server` websocket (from the `rosbridge_suite` package) and
bridges ROS topics/services to the REST API the frontend calls. The
frontend itself never talks to ROS directly.

1. Make sure your ROS 2 stack is running and `rosbridge_websocket` is
   launched. By default it listens on `ws://localhost:9090`.
2. Point the backend at it, either via an env var when you start it:

   ```bash
   cd backend
   ROSBRIDGE_URL=ws://localhost:9090 npm start
   ```

   or, if you leave `ROSBRIDGE_URL` unset, it defaults to
   `ws://localhost:9090` anyway.
3. To switch which rosbridge the backend talks to *without* restarting it
   (e.g. bouncing between a simulator and the real boat, or a boat on a
   different IP on the dock network), use the URL field next to the
   connection status dot in the dashboard header — it calls
   `POST /api/ros/connect` and reconnects live.
4. The status dot in the header is green when the backend has an active
   rosbridge connection, red otherwise. If it stays red, confirm rosbridge
   is actually reachable at that address (`ws://<host>:9090`) from wherever
   the backend is running — firewalls and being on the wrong subnet are the
   usual culprits.

## 4. Google Maps setup

The map component (`src/components/BoatMap.jsx`) uses
`@react-google-maps/api`, which needs a Google Maps JavaScript API key at
development-server startup or production-build time via `VITE_GOOGLE_MAPS_API_KEY`.

To get your own key:

1. Head to the [Google Cloud Console](https://console.cloud.google.com/),
   create a new project (or pick an existing one).
2. Enable the **Maps JavaScript API** for that project.
3. Go to **APIs & Services → Credentials**, and create a new API key (or
   reuse one you already have with that API enabled).
4. Put it in `frontend/.env`:

   ```
   VITE_GOOGLE_MAPS_API_KEY=your-key-here
   ```

For more detail, see Google's
[Maps JavaScript API getting-started guide](https://developers.google.com/maps/documentation/javascript/get-api-key).

(This app doesn't currently use Advanced Markers / cloud-based map styling,
so no separate Map ID is needed — just the API key.)

## 5. Running it

Start each terminal from the repository root. Ports 5001 (backend) and
3000 (frontend) must be available. Restart Vite after editing `frontend/.env`.

Start the backend first (it owns the ROS/Mongo connections and serves the
REST API on port 5001):

```bash
cd backend
ROSBRIDGE_URL=ws://localhost:9090 npm start
```

Then, in a second terminal, start the frontend dev server:

```bash
cd frontend
npm start
```

Open `http://localhost:3000`. In development, Vite's proxy (see
`server.proxy` in `vite.config.mjs`) forwards any `/api/*` request to the
backend at `localhost:5001`, so you don't need to configure CORS or hosts
by hand.

## 6. What's on the dashboard

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

## 7. Building for production

Run from `frontend/`:

```bash
npm run build
```

Serve the resulting `build/` folder from the backend's Express app (or any
static host) with the backend's `/api` routes reachable from the same
origin, since production hosting must configure its own API routing.

## 8. Troubleshooting

- **Map is blank / console shows a Google Maps auth error** — check
  `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env` and that the key has
  the Maps JavaScript API enabled (see "Google Maps setup" above).
- **Status dot stays red** — the backend isn't connected to rosbridge.
  Confirm rosbridge is running at the URL shown next to the status dot (see
  "Connecting to ROS 2" above), or use the header's connect field to point
  at the right one.
- **Waypoints/buoys don't save** — the backend can't reach MongoDB; check
  it's running locally on the default port.

## 9. Tests

From `frontend/`, run `npm test` for a single Vitest run or
`npm run test:watch` for watch mode.
