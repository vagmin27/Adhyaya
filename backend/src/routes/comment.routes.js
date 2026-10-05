import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {
    getVideoCommentsValidator,
    addCommentValidator,
    updateCommentValidator,
    deleteCommentValidator
} from "../validators/comment.validator.js"

const router = Router();

router
    .route("/:videoId")
    .get(getVideoCommentsValidator, getVideoComments)
    .post(verifyJWT, addCommentValidator, addComment);

router
    .route("/c/:commentId")
    .delete(verifyJWT, deleteCommentValidator, deleteComment)
    .patch(verifyJWT, updateCommentValidator, updateComment);

export default router