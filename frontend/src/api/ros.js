import client from './client';

// GET /api/ros/status -> { connected: boolean, rosbridgeUrl: string }
export async function getRosStatus() {
  const { data } = await client.get('/ros/status');
  return data;
}

// POST /api/ros/connect { url } -> reconnects the backend's rosbridge
// client to a different address at runtime.
export async function connectRos(url) {
  const { data } = await client.post('/ros/connect', { url });
  return data;
}
