import client from './client';

export async function getWaypoints() {
  const { data } = await client.get('/waypoints');
  return data;
}

// order is optional — the backend defaults it to 0, but we pass the current
// list length so new waypoints land at the end of the queue.
export async function addWaypoint(latitude, longitude, order) {
  const { data } = await client.post('/waypoints', { latitude, longitude, order });
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
