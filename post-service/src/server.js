require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const Redis = require("ioredis");
const postRoutes = require("./routes/post-routes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const app = express();
const PORT = process.env.PORT || 3002;
app.use(express.json());
app.use(cors());
app.use(helmet());
mongoose
  .connect(process.env.MONGO)
  .then(() => {
    logger.info("MongoDB connected!");
  })
  .catch((err) => {
    logger.error("MongoDB connection failed:", err);
  });

const redisClient = new Redis(process.env.REDIS_URL);

app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} to ${req.url}`);
  logger.info(`Request body: ${req.body}`);
  next();
});

app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes
);
app.use(errorHandler);

async function startServer() {
  try {
    app.listen(PORT, () => {
      logger.info(`Post service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to connect to server", error);
    process.exit(1);
  }
}

startServer();

//unhandled promise rejection

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
