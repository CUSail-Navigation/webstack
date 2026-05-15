import client from './client';

// GET /api/ros/status -> { connected: boolean, rosbridgeUrl: string }
export async function getRosStatus() {
  const { data } = await client.get('/ros/status');
  return data;
}
