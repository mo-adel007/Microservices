const logger = require("../utils/logger");
const {validateCreatePost} = require("../utils/validation");
const Post = require("../models/Post");

const createPost = async (req, res) => {
  logger.info("Create post endpoint hit");
  try {
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { content, mediaIds } = req.body;
    const post = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });
    const newlyCreatedPost = await post.save();
    logger.info(`Post created successfully: ${newlyCreatedPost}`);
    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: newlyCreatedPost,
    });
  } catch (error) {
    logger.error(`Error creating post: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Internal server error while creating post",
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
  } catch (error) {
    logger.error(`Error getting all posts: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Internal server error while getting all posts",
    });
  }
};

const getPost = async (req, res) => {
  try {
  } catch (error) {
    logger.error(`Error getting post: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Internal server error while getting post",
    });
  }
};

const deletePost = async (req, res) => {
  try {
  } catch (error) {
    logger.error(`Error deleting post: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Internal server error while deleting post",
    });
  }
};

module.exports = { createPost, getAllPosts, getPost, deletePost };
