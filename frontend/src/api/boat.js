import client from './client';

// GET /api/boat -> the single most-recent Boat document (position, headings,
// rudder/sail angles, wind, control mode, etc). See backend/src/routes/boatRoutes.js.
export async function getBoat() {
  const { data } = await client.get('/boat');
  return data;
}
