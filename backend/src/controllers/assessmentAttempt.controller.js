import mongoose, { isValidObjectId } from "mongoose";
import { Assessment } from "../models/assessment.model.js";
import { AssessmentQuestion } from "../models/assessmentQuestion.model.js";
import { AssessmentAttempt } from "../models/assessmentAttempt.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Course } from "../models/course.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { recordAssessmentSkillEvidence } from "../utils/skillMastery.js";

/**
 * Student: Start a new assessment attempt.
 */
export const startAssessmentAttempt = asyncHandler(async (req, res) => {
    const { assessmentId } = req.params;
    const studentId = req.user._id;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
        throw new ApiError(404, "Assessment not found");
    }

    if (!assessment.isPublished) {
        throw new ApiError(400, "Cannot attempt an assessment that is not currently published");
    }

    // Verify course enrollment
    const isEnrolled = await Enrollment.exists({
        student: studentId,
        course: assessment.course,
        status: { $in: ["active", "completed"] }
    });

    if (!isEnrolled) {
        throw new ApiError(403, "You must be enrolled in this course to take this assessment");
    }

    // Check for an active in-progress attempt
    const activeAttempt = await AssessmentAttempt.findOne({
        student: studentId,
        assessment: assessmentId,
        status: "in_progress"
    });

    if (activeAttempt) {
        // Check if the active attempt has expired
        const elapsedMs = Date.now() - new Date(activeAttempt.startedAt).getTime();
        const totalAllowedMs = assessment.timeLimitMinutes * 60 * 1000;

        if (elapsedMs > totalAllowedMs) {
            // Auto-expire previous attempt
            activeAttempt.status = "expired";
            activeAttempt.submittedAt = new Date();
            activeAttempt.passed = false;
            await activeAttempt.save();
        } else {
            // Return existing in-progress attempt so student can continue
            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        attemptId: activeAttempt._id,
                        attemptNumber: activeAttempt.attemptNumber,
                        startedAt: activeAttempt.startedAt,
                        timeLimitMinutes: assessment.timeLimitMinutes,
                        status: activeAttempt.status
                    },
                    "Resumed existing in-progress assessment attempt"
                )
            );
        }
    }

    // Check attempt limits
    const previousAttemptsCount = await AssessmentAttempt.countDocuments({
        student: studentId,
        assessment: assessmentId
    });

    if (assessment.maxAttempts && previousAttemptsCount >= assessment.maxAttempts) {
        throw new ApiError(
            409,
            `Maximum attempts limit (${assessment.maxAttempts}) has been reached for this assessment`
        );
    }

    const nextAttemptNumber = previousAttemptsCount + 1;

    const attempt = await AssessmentAttempt.create({
        student: studentId,
        assessment: assessmentId,
        course: assessment.course,
        attemptNumber: nextAttemptNumber,
        startedAt: new Date(),
        status: "in_progress",
        totalMarks: assessment.totalMarks
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                attemptId: attempt._id,
                attemptNumber: attempt.attemptNumber,
                startedAt: attempt.startedAt,
                timeLimitMinutes: assessment.timeLimitMinutes,
                status: attempt.status
            },
            "Assessment attempt started successfully"
        )
    );
});

/**
 * Student: Get active assessment attempt questions and remaining time.
 * SECURITY: Never exposes correctOption or answer key.
 */
export const getActiveAttempt = asyncHandler(async (req, res) => {
    const { attemptId } = req.params;
    const studentId = req.user._id;

    const attempt = await AssessmentAttempt.findById(attemptId);
    if (!attempt) {
        throw new ApiError(404, "Assessment attempt not found");
    }

    if (attempt.student.toString() !== studentId.toString()) {
        throw new ApiError(403, "You do not have permission to access another student's attempt");
    }

    if (attempt.status !== "in_progress") {
        throw new ApiError(400, `This attempt has already been ${attempt.status}`);
    }

    const assessment = await Assessment.findById(attempt.assessment);
    if (!assessment) {
        throw new ApiError(404, "Assessment not found");
    }

    const elapsedMs = Date.now() - new Date(attempt.startedAt).getTime();
    const totalAllowedMs = assessment.timeLimitMinutes * 60 * 1000;
    const remainingSeconds = Math.max(0, Math.round((totalAllowedMs - elapsedMs) / 1000));

    // Fetch questions with strict student projection (NO correctOption)
    const questions = await AssessmentQuestion.find({ assessment: assessment._id })
        .select("questionText options marks order type")
        .sort({ order: 1 })
        .lean();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                attemptId: attempt._id,
                attemptNumber: attempt.attemptNumber,
                startedAt: attempt.startedAt,
                timeLimitMinutes: assessment.timeLimitMinutes,
                remainingSeconds,
                assessment: {
                    title: assessment.title,
                    description: assessment.description,
                    instructions: assessment.instructions,
                    totalQuestions: assessment.totalQuestions,
                    totalMarks: assessment.totalMarks
                },
                questions
            },
            "Active assessment attempt retrieved successfully"
        )
    );
});

/**
 * Student: Submit answers for automatic objective grading.
 * Enforces server-side grading and time limit boundary.
 */
export const submitAssessmentAnswers = asyncHandler(async (req, res) => {
    const { attemptId } = req.params;
    const { answers = [] } = req.body;
    const studentId = req.user._id;

    const attempt = await AssessmentAttempt.findById(attemptId);
    if (!attempt) {
        throw new ApiError(404, "Assessment attempt not found");
    }

    if (attempt.student.toString() !== studentId.toString()) {
        throw new ApiError(403, "You do not have permission to submit answers for another student");
    }

    if (attempt.status !== "in_progress") {
        throw new ApiError(409, `Attempt cannot be submitted because it is already '${attempt.status}'`);
    }

    const assessment = await Assessment.findById(attempt.assessment);
    if (!assessment) {
        throw new ApiError(404, "Assessment not found");
    }

    // Check time limit with a 30-second network latency buffer
    const elapsedMs = Date.now() - new Date(attempt.startedAt).getTime();
    const allowedMs = assessment.timeLimitMinutes * 60 * 1000 + 30000;
    const isTimedOut = elapsedMs > allowedMs;

    // Fetch all questions to grade objectively on the server
    const questions = await AssessmentQuestion.find({ assessment: assessment._id });
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    let earnedMarks = 0;
    const totalMarks = assessment.totalMarks || questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const gradedAnswers = [];

    for (const q of questions) {
        const qId = q._id.toString();
        const submitted = answers.find((a) => a.questionId && a.questionId.toString() === qId);

        let selectedOption = null;
        let isCorrect = false;
        let marksAwarded = 0;

        if (submitted && submitted.selectedOption !== undefined && submitted.selectedOption !== null) {
            selectedOption = Number(submitted.selectedOption);
            if (Number.isInteger(selectedOption) && selectedOption === q.correctOption) {
                isCorrect = true;
                marksAwarded = q.marks;
                earnedMarks += marksAwarded;
            }
        }

        gradedAnswers.push({
            question: q._id,
            selectedOption,
            isCorrect,
            marksAwarded
        });
    }

    const percentage = totalMarks > 0 ? Math.min(100, Math.round((earnedMarks / totalMarks) * 100)) : 0;
    const passed = !isTimedOut && percentage >= assessment.passingPercentage;

    attempt.status = isTimedOut ? "expired" : "submitted";
    attempt.submittedAt = new Date();
    attempt.earnedMarks = earnedMarks;
    attempt.score = earnedMarks;
    attempt.totalMarks = totalMarks;
    attempt.percentage = percentage;
    attempt.passed = passed;
    attempt.answers = gradedAnswers;
    await attempt.save();

    if (attempt.status === "submitted") {
        await recordAssessmentSkillEvidence(studentId, attempt.assessment, percentage);
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                attemptId: attempt._id,
                attemptNumber: attempt.attemptNumber,
                status: attempt.status,
                score: attempt.score,
                earnedMarks: attempt.earnedMarks,
                totalMarks: attempt.totalMarks,
                percentage: attempt.percentage,
                passed: attempt.passed,
                passingPercentage: assessment.passingPercentage,
                submittedAt: attempt.submittedAt
            },
            isTimedOut ? "Assessment time expired; attempt recorded as expired" : "Assessment submitted and graded successfully"
        )
    );
});

/**
 * Student: Get result of a completed or expired attempt.
 * SECURITY: Hides the correct answer key.
 */
export const getAttemptResult = asyncHandler(async (req, res) => {
    const { attemptId } = req.params;
    const studentId = req.user._id;

    const attempt = await AssessmentAttempt.findById(attemptId);
    if (!attempt) {
        throw new ApiError(404, "Assessment attempt not found");
    }

    if (attempt.student.toString() !== studentId.toString()) {
        throw new ApiError(403, "You do not have permission to view another student's assessment result");
    }

    const assessment = await Assessment.findById(attempt.assessment).select(
        "title passingPercentage timeLimitMinutes"
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                attemptId: attempt._id,
                assessmentTitle: assessment?.title || "",
                attemptNumber: attempt.attemptNumber,
                status: attempt.status,
                score: attempt.score,
                earnedMarks: attempt.earnedMarks,
                totalMarks: attempt.totalMarks,
                percentage: attempt.percentage,
                passed: attempt.passed,
                passingPercentage: assessment?.passingPercentage || 40,
                startedAt: attempt.startedAt,
                submittedAt: attempt.submittedAt
            },
            "Assessment result retrieved successfully"
        )
    );
});

/**
 * Student: Get attempt history for a specific assessment.
 */
export const getAssessmentAttemptsHistory = asyncHandler(async (req, res) => {
    const { assessmentId } = req.params;
    const studentId = req.user._id;

    const attempts = await AssessmentAttempt.find({
        student: studentId,
        assessment: assessmentId
    })
        .select("attemptNumber status score earnedMarks totalMarks percentage passed startedAt submittedAt")
        .sort({ attemptNumber: 1 });

    return res.status(200).json(
        new ApiResponse(200, attempts, "Assessment attempts history retrieved successfully")
    );
});

/**
 * Student: Get all published assessments for a course with student-specific attempt metrics.
 */
export const getCourseAssessmentsSummary = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const assessments = await Assessment.find({
        course: courseId,
        isPublished: true
    })
        .populate("chapter", "title order")
        .sort({ createdAt: 1 })
        .lean();

    const summaryList = [];

    for (const a of assessments) {
        const attempts = await AssessmentAttempt.find({
            student: studentId,
            assessment: a._id
        })
            .select("attemptNumber status percentage passed submittedAt")
            .sort({ attemptNumber: -1 })
            .lean();

        const attemptsUsed = attempts.length;
        const attemptsRemaining = Math.max(0, a.maxAttempts - attemptsUsed);
        const bestPercentage = attempts.length > 0 ? Math.max(...attempts.map((att) => att.percentage || 0)) : null;
        const hasPassed = attempts.some((att) => att.passed === true);
        const latestAttempt = attempts[0] || null;

        summaryList.push({
            assessmentId: a._id,
            title: a.title,
            description: a.description,
            chapter: a.chapter,
            questionCount: a.totalQuestions,
            totalMarks: a.totalMarks,
            passingPercentage: a.passingPercentage,
            timeLimitMinutes: a.timeLimitMinutes,
            maxAttempts: a.maxAttempts,
            attemptsUsed,
            attemptsRemaining,
            hasPassed,
            bestPercentage,
            latestAttempt: latestAttempt
                ? {
                      attemptNumber: latestAttempt.attemptNumber,
                      status: latestAttempt.status,
                      percentage: latestAttempt.percentage,
                      passed: latestAttempt.passed,
                      submittedAt: latestAttempt.submittedAt
                  }
                : null
        });
    }

    return res.status(200).json(
        new ApiResponse(200, summaryList, "Course assessments summary retrieved successfully")
    );
});
