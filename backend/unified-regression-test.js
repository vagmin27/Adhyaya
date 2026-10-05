import http from "http";
import mongoose from "mongoose";
import { app } from "./src/app.js";
import { validateEnv } from "./src/config/env.js";
import { User } from "./src/models/user.model.js";
import { Video } from "./src/models/video.model.js";
import { Comment } from "./src/models/comment.model.js";
import { Like } from "./src/models/like.model.js";
import { Subscription } from "./src/models/subscription.model.js";
import { Playlist } from "./src/models/playlist.model.js";

async function makeRequest(server, options, bodyData = null) {
    const port = server.address().port;
    return new Promise((resolve, reject) => {
        const req = http.request(
            {
                hostname: "127.0.0.1",
                port,
                path: options.path,
                method: options.method || "GET",
                headers: options.headers || {}
            },
            (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    let parsed;
                    try {
                        parsed = JSON.parse(data);
                    } catch {
                        parsed = data;
                    }
                    resolve({ status: res.statusCode, body: parsed });
                });
            }
        );

        req.on("error", reject);

        if (bodyData) {
            req.write(typeof bodyData === "string" ? bodyData : JSON.stringify(bodyData));
        }
        req.end();
    });
}

async function runRegressionSuite() {
    console.log("=================================================");
    console.log("=== ADHYAYA COMPREHENSIVE REGRESSION TEST SUITE ===");
    console.log("=================================================");
    validateEnv();

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;
    console.log(`[PASS] Server running on test port ${port}`);

    const mongoUri = process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/adhyaya_regression_audit";
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log(`[PASS] Connected to MongoDB at ${mongoUri}`);

    const createdUserIds = [];
    const createdVideoIds = [];
    const createdPlaylistIds = [];

    try {
        const ts = Date.now();

        // ==========================================
        // 1. AUTHENTICATION & USERS MODULE
        // ==========================================
        console.log("\n--- Testing Authentication & Users ---");

        // Seed primary user and secondary user
        const userA = await User.create({
            username: `reg_alice_${ts}`,
            email: `alice_${ts}@example.com`,
            fullName: `Alice Tester ${ts}`,
            avatar: "https://example.com/alice.jpg",
            password: "password123"
        });
        createdUserIds.push(userA._id);
        const tokenA = userA.generateAccessToken();

        const userB = await User.create({
            username: `reg_bob_${ts}`,
            email: `bob_${ts}@example.com`,
            fullName: `Bob Tester ${ts}`,
            avatar: "https://example.com/bob.jpg",
            password: "password123"
        });
        createdUserIds.push(userB._id);
        const tokenB = userB.generateAccessToken();

        // Test GET /current-user
        const resCurrentUser = await makeRequest(server, {
            path: "/api/v1/users/current-user",
            method: "GET",
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        if (resCurrentUser.status === 200 && resCurrentUser.body?.data?.username === userA.username) {
            console.log("[PASS] GET /api/v1/users/current-user returns authenticated user");
        } else {
            throw new Error(`Expected 200 for current user, got ${resCurrentUser.status}`);
        }

        // Test Unauthenticated request to protected route
        const resUnauth = await makeRequest(server, {
            path: "/api/v1/users/current-user",
            method: "GET"
        });
        if (resUnauth.status === 401) {
            console.log("[PASS] Unauthenticated request correctly rejected with 401");
        } else {
            throw new Error(`Expected 401 for unauth request, got ${resUnauth.status}`);
        }

        // ==========================================
        // 2. VIDEOS MODULE
        // ==========================================
        console.log("\n--- Testing Videos Module ---");

        const video1 = await Video.create({
            videoFile: "https://example.com/v1.mp4",
            thumbnail: "https://example.com/t1.jpg",
            title: "Learn Node.js Architecture",
            description: "Deep dive into Node.js runtime and event loop",
            duration: 1800,
            views: 42,
            isPublished: true,
            owner: userA._id
        });
        createdVideoIds.push(video1._id);

        // GET /api/v1/videos (public list)
        const resGetVideos = await makeRequest(server, {
            path: "/api/v1/videos?page=1&limit=10",
            method: "GET"
        });
        if (resGetVideos.status === 200 && resGetVideos.body?.data?.docs?.length >= 1) {
            console.log("[PASS] GET /api/v1/videos returns paginated video list");
        } else {
            throw new Error(`Expected 200 with video list, got ${resGetVideos.status}`);
        }

        // GET /api/v1/videos/:videoId
        const resGetVideoById = await makeRequest(server, {
            path: `/api/v1/videos/${video1._id}`,
            method: "GET"
        });
        if (resGetVideoById.status === 200 && resGetVideoById.body?.data?.title === video1.title) {
            console.log("[PASS] GET /api/v1/videos/:videoId returns video details");
        } else {
            throw new Error(`Expected 200 for video by ID, got ${resGetVideoById.status}`);
        }

        // Invalid video ID
        const resInvalidVideoId = await makeRequest(server, {
            path: "/api/v1/videos/invalid-id-123",
            method: "GET"
        });
        if (resInvalidVideoId.status === 400) {
            console.log("[PASS] Invalid videoId returns 400 validation error");
        } else {
            throw new Error(`Expected 400 for invalid video ID, got ${resInvalidVideoId.status}`);
        }

        // ==========================================
        // 3. COMMENTS MODULE
        // ==========================================
        console.log("\n--- Testing Comments Module ---");

        // Add comment
        const resAddComment = await makeRequest(server, {
            path: `/api/v1/comments/${video1._id}`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenA}`
            }
        }, { content: "Great architectural breakdown!" });
        if (resAddComment.status === 201 && resAddComment.body?.data?.content === "Great architectural breakdown!") {
            console.log("[PASS] POST /api/v1/comments/:videoId adds comment successfully");
        } else {
            throw new Error(`Expected 201 for add comment, got ${resAddComment.status}`);
        }
        const commentId = resAddComment.body.data._id;

        // Get comments for video
        const resGetComments = await makeRequest(server, {
            path: `/api/v1/comments/${video1._id}?page=1&limit=10`,
            method: "GET"
        });
        if (resGetComments.status === 200 && resGetComments.body?.data?.docs?.length >= 1) {
            console.log("[PASS] GET /api/v1/comments/:videoId returns paginated comments with owner");
        } else {
            throw new Error(`Expected 200 for comments list, got ${resGetComments.status}`);
        }

        // Update comment authorization: User B cannot edit User A's comment
        const resAuthFailComment = await makeRequest(server, {
            path: `/api/v1/comments/c/${commentId}`,
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenB}`
            }
        }, { content: "Malicious edit" });
        if (resAuthFailComment.status === 403) {
            console.log("[PASS] Unauthorized comment edit rejected with 403 Forbidden");
        } else {
            throw new Error(`Expected 403 for unauthorized comment edit, got ${resAuthFailComment.status}`);
        }

        // ==========================================
        // 4. LIKES MODULE
        // ==========================================
        console.log("\n--- Testing Likes Module ---");

        // Toggle video like
        const resLikeVideo = await makeRequest(server, {
            path: `/api/v1/likes/toggle/v/${video1._id}`,
            method: "POST",
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        if (resLikeVideo.status === 200 && resLikeVideo.body?.data?.liked === true) {
            console.log("[PASS] POST /api/v1/likes/toggle/v/:videoId likes video (liked: true)");
        } else {
            throw new Error(`Expected 200 with liked: true, got ${resLikeVideo.status}`);
        }

        // Get liked videos
        const resGetLikedVideos = await makeRequest(server, {
            path: "/api/v1/likes/videos",
            method: "GET",
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        if (resGetLikedVideos.status === 200 && Array.isArray(resGetLikedVideos.body?.data) && resGetLikedVideos.body.data.length >= 1) {
            console.log("[PASS] GET /api/v1/likes/videos returns liked videos list");
        } else {
            throw new Error(`Expected 200 with liked videos list, got ${resGetLikedVideos.status}`);
        }

        // Toggle video like again (unlike)
        const resUnlikeVideo = await makeRequest(server, {
            path: `/api/v1/likes/toggle/v/${video1._id}`,
            method: "POST",
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        if (resUnlikeVideo.status === 200 && resUnlikeVideo.body?.data?.liked === false) {
            console.log("[PASS] POST /api/v1/likes/toggle/v/:videoId unlikes video (liked: false)");
        } else {
            throw new Error(`Expected 200 with liked: false, got ${resUnlikeVideo.status}`);
        }

        // ==========================================
        // 5. SUBSCRIPTIONS MODULE
        // ==========================================
        console.log("\n--- Testing Subscriptions Module ---");

        // Self-subscribe rejection
        const resSelfSub = await makeRequest(server, {
            path: `/api/v1/subscriptions/c/${userA._id}`,
            method: "POST",
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        if (resSelfSub.status === 400) {
            console.log("[PASS] Self-subscription rejected with 400 Bad Request");
        } else {
            throw new Error(`Expected 400 for self-sub, got ${resSelfSub.status}`);
        }

        // User A subscribes to User B
        const resSub = await makeRequest(server, {
            path: `/api/v1/subscriptions/c/${userB._id}`,
            method: "POST",
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        if (resSub.status === 200 && resSub.body?.data?.subscribed === true) {
            console.log("[PASS] POST /api/v1/subscriptions/c/:channelId subscribes (subscribed: true)");
        } else {
            throw new Error(`Expected 200 with subscribed: true, got ${resSub.status}`);
        }

        // User B's channel subscribers contains User A
        const resSubscribers = await makeRequest(server, {
            path: `/api/v1/subscriptions/c/${userB._id}`,
            method: "GET",
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        if (resSubscribers.status === 200 && resSubscribers.body?.data?.length === 1 && resSubscribers.body.data[0].subscriber?.username === userA.username) {
            console.log("[PASS] GET /api/v1/subscriptions/c/:channelId returns subscribers with user details");
        } else {
            throw new Error(`Expected 200 with subscribers list, got ${resSubscribers.status}`);
        }

        // User A's subscribed channels contains User B
        const resSubscribedChannels = await makeRequest(server, {
            path: `/api/v1/subscriptions/u/${userA._id}`,
            method: "GET",
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        if (resSubscribedChannels.status === 200 && resSubscribedChannels.body?.data?.length === 1 && resSubscribedChannels.body.data[0].channel?.username === userB.username) {
            console.log("[PASS] GET /api/v1/subscriptions/u/:subscriberId returns subscribed channels with channel details");
        } else {
            throw new Error(`Expected 200 with subscribed channels list, got ${resSubscribedChannels.status}`);
        }

        // ==========================================
        // 6. PLAYLISTS MODULE
        // ==========================================
        console.log("\n--- Testing Playlists Module ---");

        // Create playlist
        const resCreatePl = await makeRequest(server, {
            path: "/api/v1/playlist",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenA}`
            }
        }, { name: "System Design Essentials", description: "All system design lectures" });
        if (resCreatePl.status === 201 && resCreatePl.body?.data?.name === "System Design Essentials") {
            console.log("[PASS] POST /api/v1/playlist creates playlist");
        } else {
            throw new Error(`Expected 201 for playlist creation, got ${resCreatePl.status}`);
        }
        const playlistId = resCreatePl.body.data._id;
        createdPlaylistIds.push(playlistId);

        // Add video to playlist
        const resAddVid = await makeRequest(server, {
            path: `/api/v1/playlist/add/${video1._id}/${playlistId}`,
            method: "PATCH",
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        if (resAddVid.status === 200 && resAddVid.body?.data?.videos?.length === 1) {
            console.log("[PASS] PATCH /api/v1/playlist/add/:videoId/:playlistId adds video to playlist");
        } else {
            throw new Error(`Expected 200 with video added, got ${resAddVid.status}`);
        }

        // Duplicate video rejection
        const resDupVid = await makeRequest(server, {
            path: `/api/v1/playlist/add/${video1._id}/${playlistId}`,
            method: "PATCH",
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        if (resDupVid.status === 400) {
            console.log("[PASS] Adding duplicate video rejected with 400 Bad Request");
        } else {
            throw new Error(`Expected 400 for duplicate video, got ${resDupVid.status}`);
        }

        // User B cannot delete User A's playlist
        const resAuthFailDeletePl = await makeRequest(server, {
            path: `/api/v1/playlist/${playlistId}`,
            method: "DELETE",
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        if (resAuthFailDeletePl.status === 403) {
            console.log("[PASS] Unauthorized playlist deletion rejected with 403 Forbidden");
        } else {
            throw new Error(`Expected 403 for unauthorized delete, got ${resAuthFailDeletePl.status}`);
        }

        // Get user playlists
        const resUserPlaylists = await makeRequest(server, {
            path: `/api/v1/playlist/user/${userA._id}`,
            method: "GET",
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        if (resUserPlaylists.status === 200 && resUserPlaylists.body?.data?.length === 1) {
            console.log("[PASS] GET /api/v1/playlist/user/:userId returns user's playlists");
        } else {
            throw new Error(`Expected 200 with 1 playlist, got ${resUserPlaylists.status}`);
        }

        // Delete playlist
        const resDeletePl = await makeRequest(server, {
            path: `/api/v1/playlist/${playlistId}`,
            method: "DELETE",
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        if (resDeletePl.status === 200) {
            console.log("[PASS] DELETE /api/v1/playlist/:playlistId deletes playlist successfully");
        } else {
            throw new Error(`Expected 200 for playlist delete, got ${resDeletePl.status}`);
        }

        console.log("\n=================================================");
        console.log("=== ALL END-TO-END REGRESSION TESTS PASSED! ===");
        console.log("=================================================");
    } finally {
        try {
            if (createdPlaylistIds.length > 0) {
                await Playlist.deleteMany({ _id: { $in: createdPlaylistIds } });
            }
            if (createdVideoIds.length > 0) {
                await Video.deleteMany({ _id: { $in: createdVideoIds } });
            }
            if (createdUserIds.length > 0) {
                await Comment.deleteMany({ owner: { $in: createdUserIds } });
                await Like.deleteMany({ likedBy: { $in: createdUserIds } });
                await Subscription.deleteMany({
                    $or: [
                        { subscriber: { $in: createdUserIds } },
                        { channel: { $in: createdUserIds } }
                    ]
                });
                await User.deleteMany({ _id: { $in: createdUserIds } });
            }
            console.log("[PASS] Cleaned up all regression test data");
        } catch (cleanupErr) {
            console.warn("Cleanup warning:", cleanupErr.message);
        }
        await mongoose.disconnect();
        await new Promise((resolve) => server.close(resolve));
    }
}

runRegressionSuite().catch((err) => {
    console.error("Regression Suite Failed:", err);
    process.exit(1);
});
