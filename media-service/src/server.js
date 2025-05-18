require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const mediaRoutes = require("./routes/media-routes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { connectRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const { handlePostDeleted } = require("./controllers/media-controller");
const app = express();
const PORT = process.env.PORT || 3003;

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    logger.info("MongoDB connected!");
  })
  .catch((err) => {
    logger.error("MongoDB connection failed:", err);
  });
app.use(express.json());
app.use(cors());
app.use(helmet());

app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} to ${req.url}`);
  logger.info(`Request body: ${req.body}`);
  next();
});

app.use("/api/media", mediaRoutes);
app.use(errorHandler);

async function startServer() {
  try {
    await connectRabbitMQ();
    await consumeEvent("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      logger.info(`Media service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to connect to server", error);
    process.exit(1);
  }
}

startServer();
