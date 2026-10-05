import { Router } from "express";
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getChannelStatsValidator,
    getChannelVideosValidator,
} from "../validators/dashboard.validator.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/stats").get(getChannelStatsValidator, getChannelStats);
router.route("/videos").get(getChannelVideosValidator, getChannelVideos);

export default router;