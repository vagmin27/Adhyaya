import { isValidObjectId } from "mongoose";
import { Assessment } from "../models/assessment.model.js";
import { AssessmentQuestion } from "../models/assessmentQuestion.model.js";
import { Course } from "../models/course.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { recalculateAssessmentStats } from "../utils/assessmentStats.js";

/**
 * Helper to verify instructor course ownership or admin access.
 */
const verifyAssessmentOwnership = async (assessmentId, userId, userRole) => {
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
        throw new ApiError(404, "Assessment not found");
    }

    const course = await Course.findById(assessment.course);
    if (!course) {
        throw new ApiError(404, "Parent course not found");
    }

    if (course.instructor.toString() !== userId.toString() && userRole !== "admin") {
        throw new ApiError(403, "You do not have permission to modify questions for this assessment");
    }

    return { assessment, course };
};

/**
 * Instructor/Admin: Add an MCQ question to an assessment.
 */
export const createQuestion = asyncHandler(async (req, res) => {
    const { assessmentId } = req.params;
    const { questionText, options, correctOption, marks = 1, explanation = "", order } = req.body;

    const { assessment } = await verifyAssessmentOwnership(assessmentId, req.user._id, req.user.role);

    let questionOrder = order;
    if (questionOrder === undefined || questionOrder === null) {
        const lastQ = await AssessmentQuestion.findOne({ assessment: assessmentId }).sort({ order: -1 });
        questionOrder = lastQ ? lastQ.order + 1 : 1;
    }

    const question = await AssessmentQuestion.create({
        assessment: assessmentId,
        type: "mcq",
        questionText: questionText.trim(),
        options: options.map((opt) => String(opt).trim()),
        correctOption: Number(correctOption),
        marks: Number(marks) || 1,
        explanation: explanation ? String(explanation).trim() : "",
        order: questionOrder
    });

    // Update assessment totalQuestions and totalMarks
    await recalculateAssessmentStats(assessmentId);

    return res.status(201).json(
        new ApiResponse(201, question, "Assessment question created successfully")
    );
});

/**
 * Instructor/Admin: Update a question.
 */
export const updateQuestion = asyncHandler(async (req, res) => {
    const { assessmentId, questionId } = req.params;
    const { questionText, options, correctOption, marks, explanation, order } = req.body;

    await verifyAssessmentOwnership(assessmentId, req.user._id, req.user.role);

    const question = await AssessmentQuestion.findOne({ _id: questionId, assessment: assessmentId });
    if (!question) {
        throw new ApiError(404, "Question not found under the specified assessment");
    }

    if (questionText !== undefined) question.questionText = questionText.trim();
    if (options !== undefined) {
        question.options = options.map((opt) => String(opt).trim());
    }

    if (correctOption !== undefined) {
        const correctIndex = Number(correctOption);
        if (correctIndex >= question.options.length) {
            throw new ApiError(400, "Correct option index exceeds the length of options");
        }
        question.correctOption = correctIndex;
    }

    if (marks !== undefined) question.marks = Number(marks);
    if (explanation !== undefined) question.explanation = String(explanation).trim();
    if (order !== undefined) question.order = Number(order);

    await question.save();

    await recalculateAssessmentStats(assessmentId);

    return res.status(200).json(
        new ApiResponse(200, question, "Question updated successfully")
    );
});

/**
 * Instructor/Admin: Delete a question.
 */
export const deleteQuestion = asyncHandler(async (req, res) => {
    const { assessmentId, questionId } = req.params;

    await verifyAssessmentOwnership(assessmentId, req.user._id, req.user.role);

    const question = await AssessmentQuestion.findOneAndDelete({ _id: questionId, assessment: assessmentId });
    if (!question) {
        throw new ApiError(404, "Question not found under the specified assessment");
    }

    await recalculateAssessmentStats(assessmentId);

    return res.status(200).json(
        new ApiResponse(200, { deletedQuestionId: questionId }, "Question deleted successfully")
    );
});

/**
 * Instructor/Admin: Reorder questions within an assessment.
 */
export const reorderQuestions = asyncHandler(async (req, res) => {
    const { assessmentId } = req.params;
    const { orders } = req.body; // Array of { questionId, order }

    await verifyAssessmentOwnership(assessmentId, req.user._id, req.user.role);

    const updates = orders.map(({ questionId, order }) =>
        AssessmentQuestion.updateOne(
            { _id: questionId, assessment: assessmentId },
            { $set: { order: Number(order) } }
        )
    );

    await Promise.all(updates);

    const reordered = await AssessmentQuestion.find({ assessment: assessmentId }).sort({ order: 1 });

    return res.status(200).json(
        new ApiResponse(200, reordered, "Questions reordered successfully")
    );
});
