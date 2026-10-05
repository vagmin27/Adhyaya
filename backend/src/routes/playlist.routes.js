import { Router } from "express";
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createPlaylistValidator,
    updatePlaylistValidator,
    playlistIdValidator,
    addOrRemoveVideoValidator,
    getUserPlaylistsValidator
} from "../validators/playlist.validator.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createPlaylistValidator, createPlaylist);

router
    .route("/:playlistId")
    .get(playlistIdValidator, getPlaylistById)
    .patch(updatePlaylistValidator, updatePlaylist)
    .delete(playlistIdValidator, deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(addOrRemoveVideoValidator, addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(addOrRemoveVideoValidator, removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylistsValidator, getUserPlaylists);

export default router;