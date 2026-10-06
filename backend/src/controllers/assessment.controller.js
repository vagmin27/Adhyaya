import mongoose, { isValidObjectId } from "mongoose";
import { Assessment } from "../models/assessment.model.js";
import { AssessmentQuestion } from "../models/assessmentQuestion.model.js";
import { AssessmentAttempt } from "../models/assessmentAttempt.model.js";
import { Course } from "../models/course.model.js";
import { Chapter } from "../models/chapter.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { recalculateAssessmentStats } from "../utils/assessmentStats.js";

/**
 * Instructor/Admin: Create a new assessment.
 */
export const createAssessment = asyncHandler(async (req, res) => {
    const {
        courseId,
        chapterId,
        title,
        description,
        instructions,
        passingPercentage = 40,
        timeLimitMinutes = 30,
        maxAttempts = 3
    } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to create assessments for this course");
    }

    if (chapterId) {
        const chapter = await Chapter.findOne({ _id: chapterId, course: courseId });
        if (!chapter) {
            throw new ApiError(400, "The specified chapter does not belong to this course");
        }
    }

    const assessment = await Assessment.create({
        course: courseId,
        chapter: chapterId || null,
        instructor: req.user._id,
        title: title.trim(),
        description: description ? description.trim() : "",
        instructions: instructions ? instructions.trim() : "",
        passingPercentage: Number(passingPercentage),
        timeLimitMinutes: Number(timeLimitMinutes),
        maxAttempts: Number(maxAttempts),
        isPublished: false,
        totalQuestions: 0,
        totalMarks: 0
    });

    const populated = await Assessment.findById(assessment._id)
        .populate("course", "title slug")
        .populate("chapter", "title order");

    return res.status(201).json(
        new ApiResponse(201, populated, "Assessment created successfully")
    );
});

/**
 * Public/Privileged: List assessments for a course.
 * Students only see published assessments; instructors/admins see draft assessments too.
 */
export const getCourseAssessments = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const isPrivileged =
        req.user &&
        (req.user.role === "admin" ||
            req.user._id.toString() === course.instructor.toString());

    const query = { course: courseId };
    if (!isPrivileged) {
        query.isPublished = true;
    }

    const assessments = await Assessment.find(query)
        .populate("chapter", "title order")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, assessments, "Course assessments retrieved successfully")
    );
});

/**
 * Public/Privileged: Get assessment details.
 * Students NEVER receive correctOption or answer key data.
 */
export const getAssessmentById = asyncHandler(async (req, res) => {
    const { assessmentId } = req.params;

    const assessment = await Assessment.findById(assessmentId)
        .populate("course", "title slug instructor isPublished")
        .populate("chapter", "title order");

    if (!assessment) {
        throw new ApiError(404, "Assessment not found");
    }

    const course = assessment.course;
    const isPrivileged =
        req.user &&
        (req.user.role === "admin" ||
            req.user._id.toString() === course.instructor.toString());

    if (!assessment.isPublished && !isPrivileged) {
        throw new ApiError(404, "Assessment not found or is currently not published");
    }

    // Fetch questions
    let questions;
    if (isPrivileged) {
        // Instructors and admins see complete question configuration including answer key
        questions = await AssessmentQuestion.find({ assessment: assessmentId }).sort({ order: 1 });
    } else {
        // Students NEVER receive correctOption or hidden explanation
        questions = await AssessmentQuestion.find({ assessment: assessmentId })
            .select("questionText options marks order type")
            .sort({ order: 1 })
            .lean();
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                assessment,
                questions
            },
            "Assessment details retrieved successfully"
        )
    );
});

/**
 * Instructor/Admin: Update assessment metadata.
 */
export const updateAssessment = asyncHandler(async (req, res) => {
    const { assessmentId } = req.params;
    const {
        title,
        description,
        instructions,
        chapterId,
        passingPercentage,
        timeLimitMinutes,
        maxAttempts
    } = req.body;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
        throw new ApiError(404, "Assessment not found");
    }

    const course = await Course.findById(assessment.course);
    if (!course) {
        throw new ApiError(404, "Parent course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to update this assessment");
    }

    if (chapterId !== undefined) {
        if (chapterId === null || chapterId === "") {
            assessment.chapter = null;
        } else {
            const chapter = await Chapter.findOne({ _id: chapterId, course: course._id });
            if (!chapter) {
                throw new ApiError(400, "The specified chapter does not belong to this course");
            }
            assessment.chapter = chapter._id;
        }
    }

    if (title !== undefined) assessment.title = title.trim();
    if (description !== undefined) assessment.description = description.trim();
    if (instructions !== undefined) assessment.instructions = instructions.trim();
    if (passingPercentage !== undefined) assessment.passingPercentage = Number(passingPercentage);
    if (timeLimitMinutes !== undefined) assessment.timeLimitMinutes = Number(timeLimitMinutes);
    if (maxAttempts !== undefined) assessment.maxAttempts = Number(maxAttempts);

    await assessment.save();

    const updated = await Assessment.findById(assessment._id)
        .populate("chapter", "title order");

    return res.status(200).json(
        new ApiResponse(200, updated, "Assessment updated successfully")
    );
});

/**
 * Instructor/Admin: Toggle assessment publication status.
 * Rejects publication if the assessment has zero questions.
 */
export const toggleAssessmentPublish = asyncHandler(async (req, res) => {
    const { assessmentId } = req.params;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
        throw new ApiError(404, "Assessment not found");
    }

    const course = await Course.findById(assessment.course);
    if (!course) {
        throw new ApiError(404, "Parent course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to publish/unpublish this assessment");
    }

    // If publishing, ensure stats are fresh and at least one question exists
    if (!assessment.isPublished) {
        const stats = await recalculateAssessmentStats(assessmentId);
        if (stats.totalQuestions < 1) {
            throw new ApiError(
                400,
                "Cannot publish assessment with zero questions. Please add at least one question first."
            );
        }
    }

    assessment.isPublished = !assessment.isPublished;
    await assessment.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            { assessmentId: assessment._id, isPublished: assessment.isPublished },
            `Assessment ${assessment.isPublished ? "published" : "unpublished"} successfully`
        )
    );
});

/**
 * Instructor/Admin: Safely delete assessment and all associated questions & attempts.
 */
export const deleteAssessment = asyncHandler(async (req, res) => {
    const { assessmentId } = req.params;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
        throw new ApiError(404, "Assessment not found");
    }

    const course = await Course.findById(assessment.course);
    if (!course) {
        throw new ApiError(404, "Parent course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to delete this assessment");
    }

    // Clean up all related questions and attempts to prevent orphaned records
    await AssessmentQuestion.deleteMany({ assessment: assessmentId });
    await AssessmentAttempt.deleteMany({ assessment: assessmentId });
    await Assessment.findByIdAndDelete(assessmentId);

    return res.status(200).json(
        new ApiResponse(200, { deletedAssessmentId: assessmentId }, "Assessment and all associated questions and attempts deleted successfully")
    );
});
