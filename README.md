# Sailbot Webstack

A full-stack web control interface for an autonomous sailboat, built to expose live telemetry and mission control (waypoints, buoys) over a REST API backed by ROS.

## Stack

- **Backend** (`backend/`): Node.js + Express, MongoDB (Mongoose) for persistence, and a ROS bridge service (`services/rosService.js`) that surfaces live robotics data over HTTP.
- **Frontend** (`frontend/`): React (Create React App), consuming the backend API to render the boat's live map, dials, waypoints, and buoys.

## Backend structure

```
backend/src/
  server.js         # entrypoint
  app.js            # Express app setup
  config/db.js      # MongoDB connection
  models/           # Boat, Buoy, Waypoint schemas
  routes/           # REST routes for boat, buoy, waypoint, and ROS data
  services/         # rosService.js - bridges ROS topics into the API
```

## Getting started

### Backend
```
cd backend
npm install
npm start
```

### Frontend
```
cd frontend
npm install
npm start
```
