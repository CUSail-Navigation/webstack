import client from './client';

// Algorithm runtime parameters — each POST just forwards an integer to a
// ROS topic (see backend/src/routes/algoRoutes.js). Nothing is persisted.
export async function setNoGoZone(value) {
  const { data } = await client.post('/algo/no-go-zone', { value });
  return data;
}

export async function setNeutralZone(value) {
  const { data } = await client.post('/algo/neutral-zone', { value });
  return data;
}

export async function setTackingBuffer(value) {
  const { data } = await client.post('/algo/tacking-buffer', { value });
  return data;
}

// values: array of 3 numbers (H, S, V)
export async function setHsvLower(values) {
  const { data } = await client.post('/algo/hsv-lower', { values });
  return data;
}

export async function setHsvUpper(values) {
  const { data } = await client.post('/algo/hsv-upper', { values });
  return data;
}

export async function setDetectionThreshold(value) {
  const { data } = await client.post('/algo/detection-threshold', { value });
  return data;
}
