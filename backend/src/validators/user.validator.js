import fs from "fs";
import { validate } from "../middlewares/validate.middleware.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

const cleanupFiles = (files) => {
    if (!files) return;
    const fileList = Array.isArray(files) ? files : Object.values(files).flat();
    fileList.forEach((file) => {
        if (file?.path) {
            try {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (err) {
                // Ignore cleanup error
            }
        }
    });
};

export const validateRegister = (req) => {
    const errors = [];
    const body = req.body || {};

    if (typeof body.fullName === "string") {
        body.fullName = body.fullName.trim();
    }
    if (typeof body.email === "string") {
        body.email = body.email.trim().toLowerCase();
    }
    if (typeof body.username === "string") {
        body.username = body.username.trim().toLowerCase();
    }

    if (!body.fullName || typeof body.fullName !== "string" || body.fullName.length === 0) {
        errors.push({ field: "fullName", message: "Full name is required" });
    }

    if (!body.email || typeof body.email !== "string" || body.email.length === 0) {
        errors.push({ field: "email", message: "Email is required" });
    } else if (!EMAIL_REGEX.test(body.email)) {
        errors.push({ field: "email", message: "Invalid email format" });
    }

    if (!body.username || typeof body.username !== "string" || body.username.length === 0) {
        errors.push({ field: "username", message: "Username is required" });
    } else if (body.username.length < 3 || body.username.length > 30) {
        errors.push({ field: "username", message: "Username must be between 3 and 30 characters" });
    } else if (!USERNAME_REGEX.test(body.username)) {
        errors.push({ field: "username", message: "Username can only contain letters, numbers, underscores, dots, and hyphens" });
    }

    if (!body.password || typeof body.password !== "string" || body.password.length === 0) {
        errors.push({ field: "password", message: "Password is required" });
    } else if (body.password.length < 6) {
        errors.push({ field: "password", message: "Password must be at least 6 characters long" });
    }

    if (errors.length > 0 && req.files) {
        cleanupFiles(req.files);
    }

    return errors;
};


export const validateLogin = (req) => {
    const errors = [];
    const body = req.body || {};

    if (typeof body.email === "string") {
        body.email = body.email.trim().toLowerCase();
    }
    if (typeof body.username === "string") {
        body.username = body.username.trim().toLowerCase();
    }

    const hasEmail = Boolean(body.email && body.email.length > 0);
    const hasUsername = Boolean(body.username && body.username.length > 0);

    if (!hasEmail && !hasUsername) {
        errors.push({ field: "identifier", message: "Email or username is required" });
    } else if (hasEmail && !EMAIL_REGEX.test(body.email)) {
        errors.push({ field: "email", message: "Invalid email format" });
    }

    if (!body.password || typeof body.password !== "string" || body.password.length === 0) {
        errors.push({ field: "password", message: "Password is required" });
    }

    return errors;
};

export const validateRefreshToken = (req) => {
    const errors = [];
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token || typeof token !== "string" || token.trim().length === 0) {
        errors.push({ field: "refreshToken", message: "Refresh token is required in cookies or body" });
    }

    return errors;
};

export const validateChangePassword = (req) => {
    const errors = [];
    const body = req.body || {};

    if (!body.oldPassword || typeof body.oldPassword !== "string" || body.oldPassword.length === 0) {
        errors.push({ field: "oldPassword", message: "Old password is required" });
    }

    if (!body.newPassword || typeof body.newPassword !== "string" || body.newPassword.length === 0) {
        errors.push({ field: "newPassword", message: "New password is required" });
    } else if (body.newPassword.length < 6) {
        errors.push({ field: "newPassword", message: "New password must be at least 6 characters long" });
    } else if (body.oldPassword && body.newPassword === body.oldPassword) {
        errors.push({ field: "newPassword", message: "New password must be different from old password" });
    }

    return errors;
};

export const validateUpdateAccount = (req) => {
    const errors = [];
    const body = req.body || {};

    if (typeof body.fullName === "string") {
        body.fullName = body.fullName.trim();
    }
    if (typeof body.email === "string") {
        body.email = body.email.trim().toLowerCase();
    }

    if (!body.fullName || typeof body.fullName !== "string" || body.fullName.length === 0) {
        errors.push({ field: "fullName", message: "Full name is required" });
    }

    if (!body.email || typeof body.email !== "string" || body.email.length === 0) {
        errors.push({ field: "email", message: "Email is required" });
    } else if (!EMAIL_REGEX.test(body.email)) {
        errors.push({ field: "email", message: "Invalid email format" });
    }

    return errors;
};

export const registerValidator = validate(validateRegister);
export const loginValidator = validate(validateLogin);
export const refreshTokenValidator = validate(validateRefreshToken);
export const changePasswordValidator = validate(validateChangePassword);
export const updateAccountValidator = validate(validateUpdateAccount);
