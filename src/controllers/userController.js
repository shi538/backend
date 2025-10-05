
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
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

const refreshAccessToken = asyncHandler( async (req, res) =>{
    // 1. Take the refreshToken for the cookies
    // 2. check refreshtoken is receve or not
    // 3. third verify the refresh token 
    // 4. find the user for giving refreshtoken 
    // 5. find the value of the refreshtoken is save the database
    // 4. check the value of the database refreshToken and cookies refreshToken is same
    // 5. again call the genereateAccessTokenAndRefreshToken function and receve the value of the accessToken and refreshToken
    // 6. And again save the value of the receving accessToken and refreshToken for the cookies
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(400, "Not provide the incoming refresh token")
    }

    const decodedRefreshToken = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET)

    if (!decodedRefreshToken) {
        throw new ApiError(401, "Decoded RefreshToken is not  Provide")
    }

    const user = await User.findById(decodedRefreshToken._id).select(" -password -refreshToken")

    const {accessToken, refreshToken} = await generateAccessTokenAndRefresh(user._id)
          
    const options = {
        httpOnly:true,
        secure:true
    }
    res
    .status(200)
    .json(
        cookie(accessToken, options),
        cookie(refreshToken, options),
        new ApiResponse(201, "Access Token is created SuccessFully")
    )
})
  

 
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}