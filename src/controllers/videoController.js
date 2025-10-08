import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose"


const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const matchStage = {
        isPublished: true,
    };

    if (query) {
        matchStage.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
        ];
    }

    if (userId) {
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    const sortStage = {
        [sortBy]: sortType === "asc" ? 1 : -1,
    };

    const videos = await Video.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: "$owner" },//this is transform the owner array to ownwer object
        { $sort: sortStage },
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                owner: 1,
            },
        },
    ]);

    const totalVideos = await Video.countDocuments(matchStage);
    const totalPages = Math.ceil(totalVideos / limitNum);

    return res.status(200).json({
        success: true,
        totalVideos,
        totalPages,
        currentPage: pageNum,
        videos,
    });
});


const publishVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            throw new ApiError(401, "Title and description is required")
        }

        const videoLocalPath = req.files?.videoFile[0]?.path;
        const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

        const videoCloud = await uploadOnCloudinary(videoLocalPath);
        const thumbnaiCloud = await uploadOnCloudinary(thumbnailLocalPath);

        if (!videoCloud) {
            throw new ApiError(401, "Video file is required")
        }

        if (!thumbnailLocalPath) {
            throw new ApiError(401, "Thumbnail file is required")
        }

        const video = await Video.create({
            videoFile: videoCloud.url,
            thumbnail: thumbnaiCloud.url,
            owner: req.user._id,
            title: title,
            description: description,
            duration: videoCloud.duration,
            isPublished: true,

        })

        if (!video) {
            throw new ApiError(500, "Something went wrong uploading the video")

        }

        return res
            .status(200)
            .json(
                new ApiResponse(201, video, true, "Video is successfully uploaded")
            )



    } catch (error) {
        throw new ApiError(404, error?.message, "Video can not be uploaded")
    }

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req?.params;
    try {

        const video = await Video.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                fullName: 1,
                                username: 1,
                                avatar: 1,
                            }
                        }
                    ]
                },

            },
           { $unwind: "$owner" },
            {
                $project: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    views: 1,
                    isPublished: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }

        ])

        if (!video) {
            throw new ApiError(401, "Video Can not be found please choose the right video")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(201, video[0], true, "Video is successfull find")
            )
    } catch (error) {
        throw new ApiError(404, error?.message, "Video can not be find")
    }

})


const deleteVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;

        if (!videoId) {
            throw new ApiError(401, "VideoId can not receve for deleting te video")
        }

        await Video.findByIdAndDelete(videoId)

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, true, "Video is successfully deleted")
            )
    } catch (error) {
        throw new ApiError(401,error?.message, "Video can not be deleted")
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        //TODO: update video details like title, description, thumbnail
        const { title, description } = req.body

        const thumbnailLocalPath = req.file?.path;

        if (!thumbnailLocalPath) {
            throw new ApiError(401, "thumbnail local filepath can not receved")
        }

        const thumbnailCloud = await uploadOnCloudinary(thumbnailLocalPath)

        if (!thumbnailCloud) {
            throw new ApiError(500, "Cloudianry fail tu upload the file")
        }


        const video = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    thumbnail: thumbnailCloud.url,
                    title: title,
                    description: description,
                }
            }
        )

        if (!video) {
            throw new ApiError(404, "Video can not be find")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, video, true, "Video successfully updated")

            )
    } catch (error) {
        console.error(error)
        throw new ApiError(500, error.message || "Video details could not be updated")


    }

})


const togglePublishStatus = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params

        const video = await Video.findById(videoId)

        if (!video) {
            throw new ApiError(404, "Page not found")
        }

        video.isPublished = !isPublished;

        const AfterIsPublished = await video.save()

        return res
            .status(200)
            .json(
                new ApiResponse(201, AfterIsPublished, true, "IsPublished is Successfully toggele")
            )
    } catch (error) {
        throw new ApiError(401, {}, "PublishStatus can not be changed")
    }

})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    deleteVideo,
    updateVideo,
    togglePublishStatus
}