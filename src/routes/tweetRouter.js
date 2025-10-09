
import { Router } from "express";
import { createTweet, getUserTweets } from "../controllers/tweetController.js";
import { jwtVerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(jwtVerifyJWT)
router.route("/add-tweet").post(createTweet)
router.route("/get-all-tweet").get(getUserTweets)


export default router;