const winston = require("winston");

// Create a logger instance
const logger = winston.createLogger({
  // Set logging level based on environment
  // In production, use 'info' (less verbose); otherwise use 'debug'
  level: process.env.NODE_ENV === "production" ? "info" : "debug",

  // Define how logs should be formatted
  format: winston.format.combine(
    winston.format.colorize(), // Add color to log levels (useful in console)
    winston.format.timestamp(), // Include timestamp in logs
    winston.format.errors({ stack: true }), // Capture stack trace if available
    winston.format.splat(), // Support for printf-style log messages
    winston.format.json(), // Format logs as JSON (useful for files/monitoring)

    // Custom format to control final log structure
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),

  // Add default metadata to each log entry
  defaultMeta: { service: "api-gateway" },

  // Configure output destinations (transports)
  transports: [
    // Console transport with basic formatting for readability during development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Keep colorization for console
        winston.format.timestamp(), // Include timestamp
        winston.format.simple() // Simpler output format for dev readability
      ),
    }),

    // File transport for saving logs persistently
    new winston.transports.File({ filename: "error.log", level: "error" }), // Save all logs

    new winston.transports.File({ filename: "combine.log" }),
  ],
});
module.exports = logger;