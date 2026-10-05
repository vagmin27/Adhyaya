import { Router } from "express";
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createTweetValidator,
    updateTweetValidator,
    tweetIdValidator,
    getUserTweetsValidator,
} from "../validators/tweet.validator.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createTweetValidator, createTweet);
router.route("/user/:userId").get(getUserTweetsValidator, getUserTweets);
router
    .route("/:tweetId")
    .patch(updateTweetValidator, updateTweet)
    .delete(tweetIdValidator, deleteTweet);

export default router;