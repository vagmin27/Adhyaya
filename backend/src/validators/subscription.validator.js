import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

export const validateChannelId = (req) => {
    const errors = [];
    const channelId = req.params?.channelId || req.params?.subscriberId;

    if (!channelId || !isValidObjectId(channelId)) {
        errors.push({ field: "channelId", message: "Invalid channel ID format" });
    }

    return errors;
};

export const validateSubscriberId = (req) => {
    const errors = [];
    const subscriberId = req.params?.subscriberId || req.params?.channelId;

    if (!subscriberId || !isValidObjectId(subscriberId)) {
        errors.push({ field: "subscriberId", message: "Invalid subscriber ID format" });
    }

    return errors;
};

export const channelIdValidator = validate(validateChannelId);
export const subscriberIdValidator = validate(validateSubscriberId);
