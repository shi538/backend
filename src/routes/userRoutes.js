
import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccoutDetails,
  updateAvatar,
  updateCoverImage
} from "../controllers/userController.js";
import { upload } from "../middlewares/multer.middleware.js"
import { jwtVerifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()


router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ]),
  registerUser
)
router.route("/login")
.post(loginUser)
router.route("/logout")
.post(jwtVerifyJWT, logoutUser)
router.route("/refresh-access-token")
.post(refreshAccessToken)
router.route("/change-password")
.post(jwtVerifyJWT, changeCurrentPassword)
router.route("/current-user")
.get(jwtVerifyJWT, getCurrentUser)
router.route("/update-account")
.patch(jwtVerifyJWT, updateAccoutDetails)
router.route("/update-avatar")
.patch(jwtVerifyJWT,
  upload.single("avatar"), updateAvatar
)
router.route("/update-coverImage")
.patch(jwtVerifyJWT,
  upload.single("coverImage"), updateCoverImage
)
router.route("/user-channel-profile/:username")
.post(jwtVerifyJWT, getUserChannelProfile)
router.route("/watch-history")
.post(jwtVerifyJWT, getWatchHistory)

export default router;
