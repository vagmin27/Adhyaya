import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

export const validateToggleVideoLike = (req) => {
    const errors = [];
    const { videoId } = req.params || {};

    if (!videoId || !isValidObjectId(videoId)) {
        errors.push({ field: "videoId", message: "Invalid video ID format" });
    }

    return errors;
};

export const validateToggleCommentLike = (req) => {
    const errors = [];
    const { commentId } = req.params || {};

    if (!commentId || !isValidObjectId(commentId)) {
        errors.push({ field: "commentId", message: "Invalid comment ID format" });
    }

    return errors;
};

export const validateToggleTweetLike = (req) => {
    const errors = [];
    const { tweetId } = req.params || {};

    if (!tweetId || !isValidObjectId(tweetId)) {
        errors.push({ field: "tweetId", message: "Invalid tweet ID format" });
    }

    return errors;
};

export const toggleVideoLikeValidator = validate(validateToggleVideoLike);
export const toggleCommentLikeValidator = validate(validateToggleCommentLike);
export const toggleTweetLikeValidator = validate(validateToggleTweetLike);
