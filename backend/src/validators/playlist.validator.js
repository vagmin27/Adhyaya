import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

export const validateCreatePlaylist = (req) => {
    const errors = [];
    const body = req.body || {};

    if (typeof body.name === "string") {
        body.name = body.name.trim();
    }
    if (typeof body.description === "string") {
        body.description = body.description.trim();
    }

    if (!body.name || typeof body.name !== "string" || body.name.length === 0) {
        errors.push({ field: "name", message: "Playlist name is required" });
    } else if (body.name.length > 100) {
        errors.push({ field: "name", message: "Playlist name cannot exceed 100 characters" });
    }

    if (!body.description || typeof body.description !== "string" || body.description.length === 0) {
        errors.push({ field: "description", message: "Playlist description is required" });
    } else if (body.description.length > 500) {
        errors.push({ field: "description", message: "Playlist description cannot exceed 500 characters" });
    }

    return errors;
};

export const validateUpdatePlaylist = (req) => {
    const errors = [];
    const { playlistId } = req.params || {};
    const body = req.body || {};

    if (!playlistId || !isValidObjectId(playlistId)) {
        errors.push({ field: "playlistId", message: "Invalid playlist ID format" });
    }

    if (typeof body.name === "string") {
        body.name = body.name.trim();
    }
    if (typeof body.description === "string") {
        body.description = body.description.trim();
    }

    const hasName = body.name !== undefined && body.name !== "";
    const hasDescription = body.description !== undefined && body.description !== "";

    if (!hasName && !hasDescription) {
        errors.push({
            field: "updateFields",
            message: "At least one field (name or description) is required to update playlist"
        });
    }

    if (body.name !== undefined) {
        if (typeof body.name !== "string" || body.name.length === 0) {
            errors.push({ field: "name", message: "Playlist name cannot be empty" });
        } else if (body.name.length > 100) {
            errors.push({ field: "name", message: "Playlist name cannot exceed 100 characters" });
        }
    }

    if (body.description !== undefined) {
        if (typeof body.description !== "string" || body.description.length === 0) {
            errors.push({ field: "description", message: "Playlist description cannot be empty" });
        } else if (body.description.length > 500) {
            errors.push({ field: "description", message: "Playlist description cannot exceed 500 characters" });
        }
    }

    return errors;
};

export const validatePlaylistId = (req) => {
    const errors = [];
    const { playlistId } = req.params || {};

    if (!playlistId || !isValidObjectId(playlistId)) {
        errors.push({ field: "playlistId", message: "Invalid playlist ID format" });
    }

    return errors;
};

export const validateAddOrRemoveVideo = (req) => {
    const errors = [];
    const { playlistId, videoId } = req.params || {};

    if (!playlistId || !isValidObjectId(playlistId)) {
        errors.push({ field: "playlistId", message: "Invalid playlist ID format" });
    }

    if (!videoId || !isValidObjectId(videoId)) {
        errors.push({ field: "videoId", message: "Invalid video ID format" });
    }

    return errors;
};

export const validateGetUserPlaylists = (req) => {
    const errors = [];
    const { userId } = req.params || {};

    if (!userId || !isValidObjectId(userId)) {
        errors.push({ field: "userId", message: "Invalid user ID format" });
    }

    return errors;
};

export const createPlaylistValidator = validate(validateCreatePlaylist);
export const updatePlaylistValidator = validate(validateUpdatePlaylist);
export const playlistIdValidator = validate(validatePlaylistId);
export const addOrRemoveVideoValidator = validate(validateAddOrRemoveVideo);
export const getUserPlaylistsValidator = validate(validateGetUserPlaylists);
