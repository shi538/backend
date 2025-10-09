
import { Router } from "express"
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike
} from "../controllers/likeController.js";
import { jwtVerifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.use(jwtVerifyJWT)
router.route("/v/toggle-like/:videoId").post(toggleVideoLike)
router.route("/c/toogle-like/:commentId").post(toggleCommentLike)
router.route("/v/get-allliked-video").get(getLikedVideos)
export default router;