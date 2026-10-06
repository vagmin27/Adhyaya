import { isValidObjectId } from "mongoose";
import { Chapter } from "../models/chapter.model.js";
import { Course } from "../models/course.model.js";
import { Lesson } from "../models/lesson.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { recalculateCourseStats } from "../utils/courseStats.js";

/**
 * Instructor/Admin: Create a new chapter for a course.
 */
export const createChapter = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, description, order } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to add chapters to this course");
    }

    let chapterOrder = order;
    if (chapterOrder === undefined || chapterOrder === null) {
        const lastChapter = await Chapter.findOne({ course: courseId }).sort({ order: -1 });
        chapterOrder = lastChapter ? lastChapter.order + 1 : 1;
    }

    const chapter = await Chapter.create({
        title: title.trim(),
        description: description ? description.trim() : "",
        course: courseId,
        order: chapterOrder
    });

    return res.status(201).json(
        new ApiResponse(201, chapter, "Chapter created successfully")
    );
});

/**
 * Public/Privileged: Get all chapters for a course.
 */
export const getCourseChapters = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (!course.isPublished) {
        const isOwnerOrAdmin =
            req.user &&
            (req.user.role === "admin" ||
                req.user._id.toString() === course.instructor.toString());

        if (!isOwnerOrAdmin) {
            throw new ApiError(404, "Course not found or is currently not published");
        }
    }

    const chapters = await Chapter.find({ course: courseId }).sort({ order: 1 });

    return res.status(200).json(
        new ApiResponse(200, chapters, "Chapters fetched successfully")
    );
});

/**
 * Instructor/Admin: Update chapter details or order.
 */
export const updateChapter = asyncHandler(async (req, res) => {
    const { chapterId } = req.params;
    const { title, description, order } = req.body;

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
        throw new ApiError(404, "Chapter not found");
    }

    const course = await Course.findById(chapter.course);
    if (!course) {
        throw new ApiError(404, "Parent course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to modify chapters in this course");
    }

    if (title !== undefined) chapter.title = title.trim();
    if (description !== undefined) chapter.description = description.trim();
    if (order !== undefined) chapter.order = Number(order);

    await chapter.save();

    return res.status(200).json(
        new ApiResponse(200, chapter, "Chapter updated successfully")
    );
});

/**
 * Instructor/Admin: Delete a chapter and cascade delete its lessons.
 */
export const deleteChapter = asyncHandler(async (req, res) => {
    const { chapterId } = req.params;

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
        throw new ApiError(404, "Chapter not found");
    }

    const course = await Course.findById(chapter.course);
    if (!course) {
        throw new ApiError(404, "Parent course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to delete chapters in this course");
    }

    // Cascade delete lessons belonging to this chapter
    await Lesson.deleteMany({ chapter: chapterId });

    // Recalculate course cached stats
    await recalculateCourseStats(course._id);

    // Delete the chapter itself
    await Chapter.findByIdAndDelete(chapterId);

    return res.status(200).json(
        new ApiResponse(200, { deletedChapterId: chapterId }, "Chapter and its lessons deleted successfully")
    );
});
