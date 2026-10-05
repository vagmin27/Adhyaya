// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from './app.js'
import { validateEnv, env } from "./config/env.js";

dotenv.config({
    path: './.env'
})

validateEnv();

connectDB()
.then(() => {
    const server = app.listen(env.PORT, () => {
        const address = server.address();
        const port = typeof address === "object" && address !== null ? address.port : env.PORT;
        console.log(`⚙️ Server is running at port : ${port}`);
    });
})
.catch((err) => {
    console.error("MONGO db connection failed !!! ", err);
    process.exit(1);
});










/*
import express from "express"
const app = express()
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error) => {
            console.log("ERRR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})()

*/