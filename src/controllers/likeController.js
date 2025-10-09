
import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id; // from auth middleware
 // 1️⃣ Check if the user has already liked the video
  const existingLike = await Like.findOne({
    video: mongoose.Types.ObjectId(videoId),
    likedBy: mongoose.Types.ObjectId(userId)
  });

  if (existingLike) {
    // 2️⃣ If liked → remove the like
    await Like.deleteOne({ _id: existingLike._id });
    return res.status(200).json(
      new ApiResponse(200, null, true, "Video unliked successfully")
    );
  } else {
    // 3️⃣ If not liked → create a new like
    const newLike = await Like.create({
      video: mongoose.Types.ObjectId(videoId),
      likedBy: mongoose.Types.ObjectId(userId)
    });
    return res.status(200).json(
      new ApiResponse(200, newLike, true, "Video liked successfully")
    );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})


export { 
    toggleVideoLike 
}