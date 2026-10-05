import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
    let isDbHealthy = false;

    try {
        if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
            await mongoose.connection.db.admin().ping();
            isDbHealthy = true;
        }
    } catch (_) {
        isDbHealthy = false;
    }

    const healthData = {
        status: isDbHealthy ? "OK" : "UNHEALTHY",
        services: {
            process: "UP",
            database: isDbHealthy ? "UP" : "DOWN"
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    };

    if (!isDbHealthy) {
        return res
            .status(503)
            .json(new ApiResponse(503, healthData, "Service unavailable: Database connection is unhealthy"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, healthData, "Health check passed"));
});

export { healthcheck };