const express = require("express");
const cors = require('cors');
const waypointRoutes = require('./routes/waypointRoutes');
const boatRoutes = require('./routes/boatRoutes');
const buoyRoutes = require('./routes/buoyRoutes');
const rosRoutes = require('./routes/rosRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

app.use("/api/waypoints", waypointRoutes);
app.use("/api/boat", boatRoutes);
app.use('/api/buoy', buoyRoutes);
app.use('/api/ros', rosRoutes);

module.exports = app; // Export it so server.js can use it