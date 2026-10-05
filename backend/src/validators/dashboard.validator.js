import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

export const validateGetChannelStats = (req) => {
    const errors = [];
    const query = req.query || {};

    if (query.userId !== undefined && query.userId !== "") {
        if (!isValidObjectId(query.userId)) {
            errors.push({ field: "userId", message: "Invalid user ID format" });
        }
    }

    return errors;
};

export const validateGetChannelVideos = (req) => {
    const errors = [];
    const query = req.query || {};

    if (query.userId !== undefined && query.userId !== "") {
        if (!isValidObjectId(query.userId)) {
            errors.push({ field: "userId", message: "Invalid user ID format" });
        }
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

export const getChannelStatsValidator = validate(validateGetChannelStats);
export const getChannelVideosValidator = validate(validateGetChannelVideos);
