
import {Router} from "express"
import { toggleVideoLike } from "../controllers/likeController.js";


const router = Router();

router.route("/v/toggle-like/:videoId").post(toggleVideoLike)

export default router;