const app = require("./app"); // Import the logic from app.js
const connectDB = require("./config/db"); // Fixed path
const { connectROS } = require("./services/rosService");
const PORT = 5000;

// Connect to Database
connectDB();

// Connect to ROS bridge
connectROS();

// Start the actual server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});