const express = require("express");
const multer = require("multer");

const { uploadMedia, getAllMedias } = require("../controllers/media-controller");
const { authMiddleware } = require("../middleware/authMiddleware");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
}).single("file");

router.post(
  "/upload",
  authMiddleware,
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        logger.error("Multer error: ", err);
        return res.status(400).json({ success: false, message: err.message });
      } else if (err) {
        logger.error("Unknown error occured while uploading:", err);
        return res.status(500).json({
          message: "Unknown error occured while uploading:",
          error: err.message,
          stack: err.stack,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "No file found!",
        });
      }

      next();
    });
  },
  uploadMedia
);
router.get("/get", authMiddleware, getAllMedias);

module.exports = router;