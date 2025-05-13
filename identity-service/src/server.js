require("dotenv").config();

const mongoose = require("mongoose");
const logger = require("./utils/logger.js");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const app = express();
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const routes = require("./routes/identity-service.js");
const errorHandler = require("./middleware/errorHandler.js");


mongoose
  .connect(process.env.MONGO)
  .then(() => {
    logger.info("MongoDB connected!");
  })
  .catch((err) => {
    logger.error("MongoDB connection failed:", err);
  });

const redisClient = new Redis(process.env.REDIS_URL);

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} to ${req.url}`);
  logger.info(`Request body: ${req.body}`);
  next();
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).send({ success: false, message: "Too Many Requests" });
    });
});

const sensitveEndpointsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).send({ success: false, message: "Too Many Requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use("/api/auth/register", sensitveEndpointsLimiter);
app.use("/api/auth", routes);

app.use(errorHandler);

app.listen(process.env.PORT, () => {
  logger.info(`Identity service Server is running on port ${process.env.PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error({ "Unhandled Rejection:": promise, reason: reason });
});
