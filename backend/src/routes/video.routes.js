import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import {
    getAllVideosValidator,
    getVideoByIdValidator,
    publishVideoValidator,
    updateVideoValidator,
    deleteVideoValidator,
    togglePublishStatusValidator
} from "../validators/video.validator.js"

const router = Router();

router
    .route("/")
    .get(getAllVideosValidator, getAllVideos)
    .post(
        verifyJWT,
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
        ]),
        publishVideoValidator,
        publishAVideo
    );

router
    .route("/toggle/publish/:videoId")
    .patch(verifyJWT, togglePublishStatusValidator, togglePublishStatus);

router
    .route("/:videoId")
    .get(getVideoByIdValidator, getVideoById)
    .delete(verifyJWT, deleteVideoValidator, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideoValidator, updateVideo);

export default router