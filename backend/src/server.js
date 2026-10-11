const app = require("./app"); // Import the logic from app.js
const connectDB = require("./config/db"); // Fixed path
const { connectROS } = require("./services/rosService");
const PORT = Number(process.env.PORT || 5001);

// Start reading the boat queue after MongoDB is available.
connectDB().then(() => {
  connectROS();
  const queue = require('./services/waypointQueue');
  void queue.refresh();
  setInterval(() => void queue.refresh(), 1000).unref();
});

// Start the actual server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});