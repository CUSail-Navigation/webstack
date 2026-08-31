import client from './client';

// GET /api/boat -> the single most-recent Boat document (position, headings,
// rudder/sail angles, wind, control mode, etc). See backend/src/routes/boatRoutes.js.
export async function getBoat() {
  const { data } = await client.get('/boat');
  return data;
}

// POST /api/boat/control { rudder?, sail? } -> publishes a manual override
// to /sailbot/webserver_rudder / _sail and records it as the target angle.
export async function sendManualControl({ rudder, sail }) {
  const { data } = await client.post('/boat/control', { rudder, sail });
  return data;
}

// POST /api/boat/mode { mode } -> publishes to /sailbot/control_mode.
// mode is one of 'algo' | 'radio' | 'webserver' | 'controller_app'.
export async function setControlMode(mode) {
  const { data } = await client.post('/boat/mode', { mode });
  return data;
}
