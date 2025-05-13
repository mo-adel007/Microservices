const logger = require("../utils/logger");

const authMiddleware = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    logger.warn("User ID not found in headers");
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized, please login first" });
  }

  req.user = { userId };
  next();
};

module.exports = { authMiddleware };
