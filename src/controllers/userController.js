
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
const registerUser = asyncHandler(async (req, res) => {
    //This is the algorithm ofthe code
    // get user details from frontend
    // validation- not empty
    //check if user already exists:username,email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res


    const { username, email, password, fullName } = req.body

    //   if(fullName === ""){
    //       throw new ApiError(400, "fullname id required")
    //   }

    if (
        [fullName, username, email, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username is already exist")
    }
    console.log(req.files)

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong registring the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered Successfully")
    )

})

const generateAccessTokenAndRefresh = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }

}
const loginUser = asyncHandler(async (req, res) => {
    // 1. req.body Data
    // 2. username or email check
    // 3. find the user
    // 4. password check
    // 5. accessToken and refreshToken create
    // 5. Send coookie

    const { email, password, username } = req.body;
    console.log(email)

    if (!email && !username) {
        throw new ApiError(400, "Username of email is required")
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user crediantiald")
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefresh(user._id)

    const loggedInUser = await User.findById(user._id).select(" -password -refreshToken")

    const options =
    {
        httpOnly: true,
        secure: true
    }

    res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in Successfully"
            )
        )


})

const logoutUser = asyncHandler(async (req, res, next) => {
    //find the user using middleware
    //Delete the refreshToken save for database
    //delete the refresh and access token for the coookies and session
    //and removing the refreshToken for the database again save the data base refreshtoken is undefined
    console.log(req.user)

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: ""
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User LoggedOut Successfully"
            )
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    // 1. Take the refreshToken for the cookies
    // 2. check refreshtoken is receve or not
    // 3. third verify the refresh token 
    // 4. find the user for giving refreshtoken 
    // 5. find the value of the refreshtoken is save the database
    // 4. check the value of the database refreshToken and cookies refreshToken is same
    // 5. again call the genereateAccessTokenAndRefreshToken function and receve the value of the accessToken and refreshToken
    // 6. And again save the value of the receving accessToken and refreshToken for the cookies
    try {
        const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

        if (!incomingRefreshToken) {
            throw new ApiError(400, "Not provide the incoming refresh token")
        }

        const decodedRefreshToken = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET)

        if (!decodedRefreshToken) {
            throw new ApiError(401, "Decoded RefreshToken is not  Provide")
        }

        const user = await User.findById(decodedRefreshToken._id).select(" -password -refreshToken")

        const { accessToken, refreshToken } = await generateAccessTokenAndRefresh(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }
        res
            .status(200)
            .json(
                cookie(accessToken, options),
                cookie(refreshToken, options),
                new ApiResponse(201, "Access Token is created SuccessFully")
            )
    } catch (error) {
        throw new ApiError(401, error?.message, "After Expire the AccessToken in not generate again")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    // 1. Take the value of the oldPassword and newPassword for the req.body
    // 2. check the value of the olPassword and newPassword is provide or not
    // 3. Take the value of the user is req.user
    // 4. Database Query using the req.user._id
    // 5. Receve the value of the userCrediantiald and hold the value of varialbe
    // 6. Check the value of the user is recevinf and not
    // 7. and compare the database password to our oldPassword 
    // 8. Password is same to overwrite the value of the database is using the newPassword 
    // 9 . save the value of the password is database


    try {
        const { oldPassword, newPassword } = req.body

        if (!oldPassword || !newPassword) {
            throw new ApiError(401, "Fill the bothField oldPassword and newpassword")
        }

        const user = await User.findById(req.user?._id).select(" -refreshToken")

        if (!user) {
            throw new ApiError(404, "User is not provide for change the password")
        }

        const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

        if (!isPasswordCorrect) {
            throw new ApiError(400, "Invalid Password")
        }

        user.password = newPassword;

        await user.save({ validateBeforeSave: false })

        return res
            .status(200)
            .json(
                new ApiResponse(201, {}, "Password is Updated Successfully")
            )
    } catch (error) {
        throw new ApiError(401, error?.message, "Password is not change")
    }

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(200, req.user, "Current user fetched successfully")
})

const updateAccoutDetails = asyncHandler(async (req, res) => {
    const { email, fullName } = req.body

    if (!email || !fullName) {
        throw new ApiError(401, "User Crediantials is not provide the body")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                email,
                fullName
            }
        },
        {
            new: true
        }
    ).select(" -password -refreshToken",)

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account Details is Updated")
        )

})

const updateAvatar = asyncHandler(async (req, res) => {
    // 1. Take the Localfile Path for req.file
    // 2. Check the value is localPath is provide or not
    // 3. upload the localFilePathfor cloudinary and receve the original url for the file
    // 4. check the value of the url is provide or not
    // 5. find the user for req.user._id and update the value of the avatatr is avatar.url and save the value

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(401, "Avatar file is Missing")
    }
    // TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading the avatar file in cloudianary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select(" -password -refreshToken ",)


    return res
        .status(200)
        .json(
            new ApiResponse(201, user, "Avatar file is SuccessFully Updated")
        )
})

const updateCoverImage = asyncHandler(async (req, res) => {
    // 1. Take the Localfile Path for req.file
    // 2. Check the value is localPath is provide or not
    // 3. upload the localFilePath for cloudinary and receve the original url for the file
    // 4. check the value of the url is provide or not
    // 5. find the user for req.user._id and update the value of the avatatr is coverImage.url and save the value

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(401, "coverImage file is Missing")
    }

    const coverImage = await uploadOnCloudinary(avatarLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading the coverImage file in cloudianary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select(" -password -refreshToken ")


    return res
        .status(200)
        .json(
            new ApiResponse(201, user, "coverImage file is SuccessFully Updated")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username.trim()) {
        throw new ApiError(401, "username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,

                    }
                }
            },

        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not find")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, "User profile is fetched Successfully")
    )

})

const getWatchHistory = asyncHandler( async(req, res) => {
    const user = await User.aggregate([
        {
            $watch: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as:"watchHistory",
                pipeline: [
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
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }  
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, true,"Watch hitory fetched successfully" )
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccoutDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
