import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { env } from "../config/env.js";

/**
 * Safely resolves the MongoDB connection URI and target database name.
 * Handles:
 * 1. URIs without database name (e.g. mongodb://localhost:27017 or mongodb+srv://cluster.mongodb.net)
 * 2. URIs with trailing slash (e.g. mongodb://localhost:27017/)
 * 3. URIs already containing a database name (e.g. mongodb://localhost:27017/adhyaya)
 * 4. URIs with query parameters (e.g. .../?retryWrites=true or .../custom_db?retryWrites=true)
 */
export const resolveMongoUri = (rawUri, defaultDbName = DB_NAME) => {
    if (!rawUri || typeof rawUri !== "string") {
        return { connectionUri: rawUri, dbName: defaultDbName };
    }

    const trimmed = rawUri.trim();

    try {
        const [baseWithSlash, ...queryParts] = trimmed.split("?");
        const queryString = queryParts.length > 0 ? `?${queryParts.join("?")}` : "";
        const cleanBase = baseWithSlash.replace(/\/+$/, "");

        const match = cleanBase.match(/^((?:mongodb(?:\+srv)?):\/\/[^\/]+)(?:\/(.+))?$/i);

        if (match) {
            const hostPart = match[1];
            const existingDb = match[2];

            if (existingDb && existingDb.trim().length > 0) {
                return {
                    connectionUri: `${hostPart}/${existingDb.trim()}${queryString}`,
                    dbName: existingDb.trim()
                };
            }

            return {
                connectionUri: `${hostPart}/${defaultDbName}${queryString}`,
                dbName: defaultDbName
            };
        }
    } catch (_) {
        // Fallback to safe append if parsing regex encounters unexpected format
    }

    return {
        connectionUri: trimmed.includes(defaultDbName)
            ? trimmed
            : `${trimmed.replace(/\/+$/, "")}/${defaultDbName}`,
        dbName: defaultDbName
    };
};

const connectDB = async () => {
    try {
        const { connectionUri, dbName } = resolveMongoUri(env.MONGODB_URI, DB_NAME);

        const connectionInstance = await mongoose.connect(connectionUri);

        console.log(
            `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host} | DB NAME: ${connectionInstance.connection.name || dbName}`
        );
    } catch (error) {
        console.error("MONGODB connection FAILED ", error);
        process.exit(1);
    }
};

export default connectDB;