

import { Video } from "../models/video.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.


})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const videos = await Video
})

export {
    getChannelStats,
    getChannelVideos
}























// Find the total views of all videos uploaded by a particular channel/user.

// Count the total number of subscribers the channel has.

// Count total videos uploaded by that channel.

// Sum total likes on all videos (or on channel, if stored separately).

// Basically, it’s meant to return summary statistics for a channel.