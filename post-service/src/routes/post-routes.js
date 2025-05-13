const express = require("express");
const { createPost } = require("../controllers/post-controller");

const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/create-post", createPost);

module.exports = router;