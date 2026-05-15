import client from './client';

export async function getBuoys() {
  const { data } = await client.get('/buoy');
  return data;
}

export async function addBuoy(latitude, longitude) {
  const { data } = await client.post('/buoy/add', { latitude, longitude });
  return data;
}

export async function deleteBuoy(id) {
  const { data } = await client.delete(`/buoy/${id}`);
  return data;
}
