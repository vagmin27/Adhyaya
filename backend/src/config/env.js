import dotenv from "dotenv";

dotenv.config({
    path: "./.env"
});

export const validateEnv = () => {
    const isProduction = process.env.NODE_ENV === "production";
    const missing = [];

    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.trim() === "") {
        missing.push("MONGODB_URI");
    }

    if (!process.env.ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET.trim() === "") {
        if (isProduction) {
            missing.push("ACCESS_TOKEN_SECRET");
        } else {
            process.env.ACCESS_TOKEN_SECRET = "dev_default_access_token_secret_key_12345";
            console.warn("ACCESS_TOKEN_SECRET is not set in .env. Using fallback development secret.");
        }
    }

    if (!process.env.REFRESH_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET.trim() === "") {
        if (isProduction) {
            missing.push("REFRESH_TOKEN_SECRET");
        } else {
            process.env.REFRESH_TOKEN_SECRET = "dev_default_refresh_token_secret_key_12345";
            console.warn("REFRESH_TOKEN_SECRET is not set in .env. Using fallback development secret.");
        }
    }

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
    get ACCESS_TOKEN_SECRET() {
        return process.env.ACCESS_TOKEN_SECRET;
    },
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || "1d",
    get REFRESH_TOKEN_SECRET() {
        return process.env.REFRESH_TOKEN_SECRET;
    },
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
