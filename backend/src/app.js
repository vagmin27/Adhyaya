import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import helmet from "helmet"
import mongoSanitize from "express-mongo-sanitize"
import { env } from "./config/env.js"
import { ApiError } from "./utils/ApiError.js"
import { errorHandler } from "./middlewares/error.middleware.js"

const app = express()

app.use(helmet())

const corsOrigin = env.CORS_ORIGIN === "*"
    ? true
    : env.CORS_ORIGIN.includes(",")
        ? env.CORS_ORIGIN.split(",").map((o) => o.trim())
        : env.CORS_ORIGIN;

app.use(cors({
    origin: corsOrigin,
    credentials: true
}))


app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(mongoSanitize())
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import courseRouter from "./routes/course.routes.js"
import chapterRouter from "./routes/chapter.routes.js"
import lessonRouter from "./routes/lesson.routes.js"
import enrollmentRouter from "./routes/enrollment.routes.js"
import progressRouter from "./routes/progress.routes.js"
import assessmentRouter from "./routes/assessment.routes.js"
import assessmentAttemptRouter from "./routes/assessmentAttempt.routes.js"
import skillRouter from "./routes/skill.routes.js"

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/courses", courseRouter)
app.use("/api/v1/chapters", chapterRouter)
app.use("/api/v1/lessons", lessonRouter)
app.use("/api/v1/enrollments", enrollmentRouter)
app.use("/api/v1/progress", progressRouter)
app.use("/api/v1/assessments", assessmentRouter)
app.use("/api/v1/assessment-attempts", assessmentAttemptRouter)
app.use("/api/v1/skills", skillRouter)

// 404 handler for unmatched routes
app.use((req, res, next) => {
    next(new ApiError(404, "Route not found"))
})

// Centralized error handling middleware
app.use(errorHandler)

export { app }