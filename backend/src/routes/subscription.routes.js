import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    channelIdValidator,
    subscriberIdValidator,
} from "../validators/subscription.validator.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .get(channelIdValidator, getUserChannelSubscribers)
    .post(channelIdValidator, toggleSubscription);

router.route("/u/:subscriberId").get(subscriberIdValidator, getSubscribedChannels);

export default router;