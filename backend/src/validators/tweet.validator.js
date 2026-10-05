import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

export const validateCreateTweet = (req) => {
    const errors = [];
    const body = req.body || {};

    if (typeof body.content === "string") {
        body.content = body.content.trim();
    }

    if (!body.content || typeof body.content !== "string" || body.content.length === 0) {
        errors.push({ field: "content", message: "Tweet content is required" });
    } else if (body.content.length > 500) {
        errors.push({ field: "content", message: "Tweet content cannot exceed 500 characters" });
    }

    return errors;
};

export const validateUpdateTweet = (req) => {
    const errors = [];
    const { tweetId } = req.params || {};
    const body = req.body || {};

    if (!tweetId || !isValidObjectId(tweetId)) {
        errors.push({ field: "tweetId", message: "Invalid tweet ID format" });
    }

    if (typeof body.content === "string") {
        body.content = body.content.trim();
    }

    if (!body.content || typeof body.content !== "string" || body.content.length === 0) {
        errors.push({ field: "content", message: "Tweet content is required" });
    } else if (body.content.length > 500) {
        errors.push({ field: "content", message: "Tweet content cannot exceed 500 characters" });
    }

    return errors;
};

export const validateTweetId = (req) => {
    const errors = [];
    const { tweetId } = req.params || {};

    if (!tweetId || !isValidObjectId(tweetId)) {
        errors.push({ field: "tweetId", message: "Invalid tweet ID format" });
    }

    return errors;
};

export const validateGetUserTweets = (req) => {
    const errors = [];
    const { userId } = req.params || {};
    const query = req.query || {};

    if (!userId || !isValidObjectId(userId)) {
        errors.push({ field: "userId", message: "Invalid user ID format" });
    }

    if (query.page !== undefined && query.page !== "") {
        const pageNum = Number(query.page);
        if (!Number.isInteger(pageNum) || pageNum < 1) {
            errors.push({ field: "page", message: "Page must be a positive integer" });
        } else {
            req.query.page = pageNum;
        }
    } else {
        req.query.page = 1;
    }

    if (query.limit !== undefined && query.limit !== "") {
        const limitNum = Number(query.limit);
        if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 50) {
            errors.push({ field: "limit", message: "Limit must be an integer between 1 and 50" });
        } else {
            req.query.limit = limitNum;
        }
    } else {
        req.query.limit = 10;
    }

    return errors;
};

export const createTweetValidator = validate(validateCreateTweet);
export const updateTweetValidator = validate(validateUpdateTweet);
export const tweetIdValidator = validate(validateTweetId);
export const getUserTweetsValidator = validate(validateGetUserTweets);
