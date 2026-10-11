import client from './client';

export async function getWaypoints() {
  const { data } = await client.get('/waypoints');
  return data;
}

export async function getWaypointStatus() {
  const { data } = await client.get('/waypoints/status');
  return data;
}

// The backend appends to the live boat queue; the browser never assigns order.
export async function addWaypoint(latitude, longitude) {
  const { data } = await client.post('/waypoints', { latitude, longitude });
  return data;
}

export async function reorderWaypoints(orderedIds) {
  const { data } = await client.put('/waypoints/reorder', { orderedIds });
  return data;
}

export async function deleteWaypoint(id) {
  const { data } = await client.delete(`/waypoints/${id}`);
  return data;
}

export async function clearWaypoints() {
  const { data } = await client.delete('/waypoints/clear');
  return data;
}
