import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ApiError)) {
        let statusCode = error.statusCode || 500;
        let message = error.message || "Something went wrong";
        let errors = [];

        if (error instanceof mongoose.Error.CastError) {
            statusCode = 400;
            message = `Invalid ${error.path}: ${error.value}`;
        } else if (error instanceof mongoose.Error.ValidationError) {
            statusCode = 400;
            errors = Object.values(error.errors || {}).map((item) => item.message);
            message = errors.join(", ") || "Validation Error";
        } else if (error.code === 11000) {
            statusCode = 409;
            const field = Object.keys(error.keyValue || {})[0];
            message = field
                ? `Duplicate value for field: ${field}`
                : "Duplicate field value entered";
        }

        error = new ApiError(statusCode, message, errors, error.stack);
    }

    const response = {
        statusCode: error.statusCode,
        data: null,
        message: error.message,
        success: false,
        errors: error.errors || [],
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {})
    };

    return res.status(error.statusCode).json(response);
};

export { errorHandler };
