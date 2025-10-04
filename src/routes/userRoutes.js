
import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/userController.js";
import {upload} from "../middlewares/multer.middleware.js"
import { jwtVerifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

router.route("/register").post(
    upload.fields([
      {
        name:"avatar",
        maxCount:1
      },
      {
        name:"coverImage",
        maxCount:1
      }
    ]),
    registerUser
)
router.route("/login").post(loginUser)
router.route("/logout").post(jwtVerifyJWT, logoutUser)

export default router;
