import axios from 'axios';

// All backend routes are mounted under /api (see backend/src/app.js).
// We don't hardcode a host+port here — in dev, CRA's "proxy" field in
// package.json forwards unmatched requests to http://localhost:5000,
// and in production the frontend build is served by the same origin
// as the backend, so a relative baseURL works in both cases.
const client = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export default client;
