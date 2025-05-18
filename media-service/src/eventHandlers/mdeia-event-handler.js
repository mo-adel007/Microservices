const Media = require("../models/Media");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");

const handlePostDeleted = async (event) => {
  console.log(event, "eventeventevent");
  const { postId, medaIds } = event;
  try {
    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });
    for (const media of mediaToDelete) {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);
      logger.info(`Media deleted from cloudinary: ${media.publicId}`);
    }
    logger.info(`Post deleted event handled for postId: ${postId}`);
  } catch (error) {
    logger.error("Error handling post deleted event", error);
  }
};
module.exports = { handlePostDeleted };
