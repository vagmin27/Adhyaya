import { isValidObjectId } from "mongoose";
import { Lesson } from "../models/lesson.model.js";
import { Chapter } from "../models/chapter.model.js";
import { Course } from "../models/course.model.js";
import { Video } from "../models/video.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { recalculateCourseStats } from "../utils/courseStats.js";

/**
 * Instructor/Admin: Create a new lesson under a chapter.
 */
export const createLesson = asyncHandler(async (req, res) => {
    const { chapterId } = req.params;
    const {
        title,
        description,
        type = "video",
        videoId,
        content,
        duration = 0,
        isFreePreview = false,
        order,
        attachments
    } = req.body;

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
        throw new ApiError(404, "Chapter not found");
    }

    const course = await Course.findById(chapter.course);
    if (!course) {
        throw new ApiError(404, "Parent course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to add lessons to this course");
    }

    let resolvedDuration = Number(duration) || 0;
    let resolvedVideo = null;

    if (type === "video") {
        if (videoId) {
            const videoDoc = await Video.findById(videoId);
            if (!videoDoc) {
                throw new ApiError(404, `Referenced video with ID '${videoId}' does not exist`);
            }
            resolvedVideo = videoDoc._id;
            if (!resolvedDuration && videoDoc.duration) {
                resolvedDuration = videoDoc.duration;
            }
        }
    }

    let lessonOrder = order;
    if (lessonOrder === undefined || lessonOrder === null) {
        const lastLesson = await Lesson.findOne({ chapter: chapterId }).sort({ order: -1 });
        lessonOrder = lastLesson ? lastLesson.order + 1 : 1;
    }

    const lesson = await Lesson.create({
        title: title.trim(),
        description: description ? description.trim() : "",
        chapter: chapterId,
        course: course._id,
        order: lessonOrder,
        type,
        video: resolvedVideo,
        content: type === "article" ? content || "" : "",
        duration: resolvedDuration,
        isFreePreview: Boolean(isFreePreview),
        attachments: Array.isArray(attachments) ? attachments : []
    });

    // Update course summary statistics
    await recalculateCourseStats(course._id);

    const createdLesson = await Lesson.findById(lesson._id).populate("video", "title duration thumbnail videoFile");

    return res.status(201).json(
        new ApiResponse(201, createdLesson, "Lesson created successfully")
    );
});

/**
 * Public/Authenticated: Get lesson content.
 * Free preview lessons can be accessed publicly; non-preview lessons require authentication.
 */
export const getLessonById = asyncHandler(async (req, res) => {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId).populate("video", "title duration thumbnail videoFile views");
    if (!lesson) {
        throw new ApiError(404, "Lesson not found");
    }

    const course = await Course.findById(lesson.course);
    if (!course) {
        throw new ApiError(404, "Parent course not found");
    }

    const isOwnerOrAdmin =
        req.user &&
        (req.user.role === "admin" ||
            req.user._id.toString() === course.instructor.toString());

    // Unpublished course access check
    if (!course.isPublished && !isOwnerOrAdmin) {
        throw new ApiError(404, "Course is not published");
    }

    // Access check: If lesson is not free preview, require authentication and enrollment
    if (!lesson.isFreePreview) {
        if (!req.user) {
            throw new ApiError(401, "Authentication required to access this lesson");
        }

        if (!isOwnerOrAdmin) {
            const isEnrolled = await Enrollment.exists({
                student: req.user._id,
                course: lesson.course,
                status: { $in: ["active", "completed"] }
            });

            if (!isEnrolled) {
                throw new ApiError(403, "You must be enrolled in this course to access this lesson");
            }
        }
    }

    return res.status(200).json(
        new ApiResponse(200, lesson, "Lesson retrieved successfully")
    );
});

/**
 * Instructor/Admin: Update lesson metadata or content.
 */
export const updateLesson = asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const {
        title,
        description,
        type,
        videoId,
        content,
        duration,
        isFreePreview,
        order,
        attachments
    } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new ApiError(404, "Lesson not found");
    }

    const course = await Course.findById(lesson.course);
    if (!course) {
        throw new ApiError(404, "Parent course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to modify this lesson");
    }

    if (type !== undefined) {
        lesson.type = type;
        if (type === "article") {
            lesson.video = null;
        }
    }

    if (videoId !== undefined) {
        if (videoId === null || videoId === "") {
            lesson.video = null;
        } else {
            const videoDoc = await Video.findById(videoId);
            if (!videoDoc) {
                throw new ApiError(404, `Referenced video with ID '${videoId}' does not exist`);
            }
            lesson.video = videoDoc._id;
            if (duration === undefined && videoDoc.duration) {
                lesson.duration = videoDoc.duration;
            }
        }
    }

    if (title !== undefined) lesson.title = title.trim();
    if (description !== undefined) lesson.description = description.trim();
    if (content !== undefined) lesson.content = content;
    if (duration !== undefined) lesson.duration = Number(duration) || 0;
    if (isFreePreview !== undefined) lesson.isFreePreview = Boolean(isFreePreview);
    if (order !== undefined) lesson.order = Number(order);
    if (attachments !== undefined) {
        lesson.attachments = Array.isArray(attachments) ? attachments : [];
    }

    await lesson.save();

    // Recalculate course statistics in case duration changed
    await recalculateCourseStats(course._id);

    const updatedLesson = await Lesson.findById(lesson._id).populate("video", "title duration thumbnail videoFile");

    return res.status(200).json(
        new ApiResponse(200, updatedLesson, "Lesson updated successfully")
    );
});

/**
 * Instructor/Admin: Delete a lesson.
 */
export const deleteLesson = asyncHandler(async (req, res) => {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new ApiError(404, "Lesson not found");
    }

    const course = await Course.findById(lesson.course);
    if (!course) {
        throw new ApiError(404, "Parent course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to delete this lesson");
    }

    await Lesson.findByIdAndDelete(lessonId);

    // Update course summary statistics
    await recalculateCourseStats(course._id);

    return res.status(200).json(
        new ApiResponse(200, { deletedLessonId: lessonId }, "Lesson deleted successfully")
    );
});
