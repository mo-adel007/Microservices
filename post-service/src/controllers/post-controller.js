const logger = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");
const Post = require("../models/Post");

async function invalidatePostCache(req, input) {
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);
  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

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
    await invalidatePostCache(req, newlyCreatedPost._id.toString());
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);
    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    const totalPosts = await Post.countDocuments({});
    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
    };
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));
    res.json(result);
    logger.info(`Fetched all posts successfully: ${posts.length} posts`);
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
    const postId = req.params.id;
    const cachekey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cachekey);

    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }

    const singlePostDetailsbyId = await Post.findById(postId);

    if (!singlePostDetailsbyId) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    await req.redisClient.setex(
      cachedPost,
      3600,
      JSON.stringify(singlePostDetailsbyId)
    );

    res.json(singlePostDetailsbyId);
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
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    //publish post delete method ->
    // await publishEvent("post.deleted", {
    //   postId: post._id.toString(),
    //   userId: req.user.userId,
    //   mediaIds: post.mediaIds,
    // });

    await invalidatePostCache(req, req.params.id);
    res.json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting post", error);
    res.status(500).json({
      success: false,
      message: "Error deleting post",
    });
  }
};

module.exports = { createPost, getAllPosts, getPost, deletePost };
