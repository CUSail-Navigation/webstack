import client from './client';

// GET /api/boat -> the single most-recent Boat document (position, headings,
// rudder/sail angles, wind, control mode, etc). See backend/src/routes/boatRoutes.js.
export async function getBoat() {
  const { data } = await client.get('/boat');
  return data;
}

// POST /api/boat/control { rudder?, sail?, jib?, jibSide? } -> manual override.
// jibSide is 0 (port) or 1 (starboard).
export async function sendManualControl({ rudder, sail, jib, jibSide }) {
  const { data } = await client.post('/boat/control', { rudder, sail, jib, jibSide });
  return data;
}

// POST /api/boat/mode { mode } -> publishes to /sailbot/control_mode.
// mode is one of 'algo' | 'radio' | 'webserver' | 'controller_app'.
export async function setControlMode(mode) {
  const { data } = await client.post('/boat/mode', { mode });
  return data;
}
