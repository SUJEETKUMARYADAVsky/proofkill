const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const insightsRoutes = require("./routes/insightsRoutes");
const publicRoutes = require("./routes/publicRoutes");
const { loadState } = require("./utils/dataStore");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/public", publicRoutes);

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Authentication API is running.",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await loadState();

    app.listen(PORT);
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

startServer();
