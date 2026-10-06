import { isValidObjectId } from "mongoose";
import { Enrollment } from "../models/enrollment.model.js";
import { Course } from "../models/course.model.js";
import { Lesson } from "../models/lesson.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Student: Enroll in a course.
 */
export const enrollInCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Public students can only enroll in published courses
    const isPrivileged = req.user.role === "admin" || course.instructor.toString() === studentId.toString();
    if (!course.isPublished && !isPrivileged) {
        throw new ApiError(400, "Cannot enroll in a course that is not currently published");
    }

    const existingEnrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId
    });

    if (existingEnrollment) {
        if (existingEnrollment.status === "dropped") {
            existingEnrollment.status = "active";
            existingEnrollment.lastAccessedAt = new Date();
            await existingEnrollment.save();

            const populated = await Enrollment.findById(existingEnrollment._id)
                .populate("course", "title slug thumbnail category level totalLessons totalDuration")
                .populate("lastAccessedLesson", "title order type");

            return res.status(200).json(
                new ApiResponse(200, populated, "Re-enrolled in course successfully")
            );
        }

        const populated = await Enrollment.findById(existingEnrollment._id)
            .populate("course", "title slug thumbnail category level totalLessons totalDuration")
            .populate("lastAccessedLesson", "title order type");

        return res.status(200).json(
            new ApiResponse(200, populated, "Already enrolled in this course")
        );
    }

    const totalLessons = await Lesson.countDocuments({ course: courseId });

    const newEnrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        status: "active",
        progressPercentage: 0,
        completedLessonsCount: 0,
        totalLessonsCount: totalLessons,
        enrolledAt: new Date(),
        lastAccessedAt: new Date()
    });

    const populated = await Enrollment.findById(newEnrollment._id)
        .populate("course", "title slug thumbnail category level totalLessons totalDuration")
        .populate("lastAccessedLesson", "title order type");

    return res.status(201).json(
        new ApiResponse(201, populated, "Enrolled in course successfully")
    );
});

/**
 * Student: Get all courses the authenticated student is enrolled in.
 */
export const getMyEnrolledCourses = asyncHandler(async (req, res) => {
    const studentId = req.user._id;
    const { status } = req.query;

    const query = { student: studentId };
    if (status) {
        query.status = status;
    } else {
        query.status = { $in: ["active", "completed"] };
    }

    const enrollments = await Enrollment.find(query)
        .populate({
            path: "course",
            select: "title slug thumbnail category level totalLessons totalDuration instructor isPublished",
            populate: {
                path: "instructor",
                select: "fullName username avatar"
            }
        })
        .populate("lastAccessedLesson", "title order type")
        .sort({ lastAccessedAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, enrollments, "Enrolled courses retrieved successfully")
    );
});

/**
 * Student: Get enrollment status for a specific course.
 */
export const getCourseEnrollment = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const enrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId
    })
        .populate("course", "title slug thumbnail totalLessons totalDuration")
        .populate("lastAccessedLesson", "title order type");

    if (!enrollment) {
        return res.status(200).json(
            new ApiResponse(200, { isEnrolled: false, enrollment: null }, "Not enrolled in this course")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, { isEnrolled: true, enrollment }, "Enrollment record retrieved successfully")
    );
});
