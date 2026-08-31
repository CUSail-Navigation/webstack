import client from './client';

// POST /api/mission/station-keeping { corners: [{latitude, longitude}, x4] }
export async function activateStationKeeping(corners) {
  const { data } = await client.post('/mission/station-keeping', { corners });
  return data;
}

// POST /api/mission/manual-mode — cancels station keeping or CV search.
export async function setManualMode() {
  const { data } = await client.post('/mission/manual-mode');
  return data;
}

// POST /api/mission/activate-cv — switches to computer-vision search mode.
export async function activateCV() {
  const { data } = await client.post('/mission/activate-cv');
  return data;
}
