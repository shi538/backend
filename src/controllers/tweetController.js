
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;

    if (!content) {
        throw new ApiError(401, "Content is required")
    }

    const tweet = await Tweet.create(
        {
            content:content,
            owner:req.body?._id
        }
    )

    if (!tweet) {
        throw new ApiError(404, "Something went wrong create the tweet") 
    }

    return res
            .status(200)
            .json(
                new ApiResponse(200, tweet, true, "Tweet is successfully created")
            )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const userId = req.user?._id;

   const users =  await Tweet.find({owner: userId}).select("-owner")

   if(!users.lenght){
    throw new ApiError(404, "Tweet can not find")

   }
   return res
        .status(200)
        .json(
            new ApiResponse(200, users, true, "User issuccesfuly fetched")
        )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}