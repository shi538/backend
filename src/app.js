
import express, { urlencoded } from 'express';
import dotenv from 'dotenv';
import cors from 'cors'
import cookieParser from 'cookie-parser';
dotenv.config();

const app = express();

app.use(express.json({
    limit: "20kb"
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true,
}))
app.use(express.urlencoded({
    extended:true,
    limit:"30kb"
}))
app.use(express.static("public"))
app.use(cookieParser())

//router import
import UserRouter from "./routes/userRoutes.js"
import VideoRouter from "./routes/videoRouter.js"
import CommentRouter from "./routes/commentRouter.js"
//router declaration
app.use("/api/v1/users", UserRouter);
app.use("/api/v1/users", VideoRouter);
app.use("/api/v1/users", CommentRouter);


export {app};