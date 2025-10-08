
import { Router } from "express";
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment
} from "../controllers/commentController.js";
import { jwtVerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(jwtVerifyJWT)
router.route("/get-video-comments/:videoId")
    .get(getVideoComments)
router.route("/add-commmnet/:videoId")
    .post(addComment)
router.route("/delete-comment/:videoId")
    .delete(deleteComment)
router.route("/update-comment/:videoId")
    .patch(updateComment);

    export default router;