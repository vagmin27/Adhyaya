import dotenv from "dotenv";

dotenv.config({
    path: "./.env"
});

const requiredEnvVars = [
    "MONGODB_URI",
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET"
];

export const validateEnv = () => {
    const missing = requiredEnvVars.filter((key) => {
        const val = process.env[key];
        return !val || val.trim() === "";
    });

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variable(s): ${missing.join(", ")}. Please check your .env file.`
        );
    }
};

export const env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || 8000,
    MONGODB_URI: process.env.MONGODB_URI,
    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || "1d",
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "10d",
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
};

export const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
});

export const cookieOptions = {
    httpOnly: true,
    get secure() {
        return process.env.NODE_ENV === "production";
    },
    get sameSite() {
        return process.env.NODE_ENV === "production" ? "none" : "lax";
    }
};
