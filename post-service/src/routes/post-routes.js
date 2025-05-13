const express = require("express");
const {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
} = require("../controllers/post-controller");

const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/create-post", createPost);
router.get("/all-posts", getAllPosts);
router.get("/:id", getPost);
router.delete("/:id", deletePost);

module.exports = router;
