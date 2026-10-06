import { isValidObjectId } from "mongoose";
import { LessonProgress } from "../models/lessonProgress.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Chapter } from "../models/chapter.model.js";
import { Course } from "../models/course.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { recordLessonSkillEvidence } from "../utils/skillMastery.js";

/**
 * Student: Update progress on a lesson (playback position, seconds watched, completion).
 */
export const updateLessonProgress = asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const { secondsWatched, lastPositionSeconds, isCompleted } = req.body;
    const studentId = req.user._id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new ApiError(404, "Lesson not found");
    }

    const courseId = lesson.course;
    const chapterId = lesson.chapter;

    // Ensure enrollment exists for the course, auto-enrolling if not yet created
    let enrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId
    });

    if (!enrollment) {
        const totalLessonsCount = await Lesson.countDocuments({ course: courseId });
        enrollment = await Enrollment.create({
            student: studentId,
            course: courseId,
            status: "active",
            progressPercentage: 0,
            completedLessonsCount: 0,
            totalLessonsCount,
            enrolledAt: new Date(),
            lastAccessedAt: new Date(),
            lastAccessedLesson: lessonId
        });
    }

    let progress = await LessonProgress.findOne({
        student: studentId,
        lesson: lessonId
    });

    if (!progress) {
        progress = new LessonProgress({
            student: studentId,
            course: courseId,
            chapter: chapterId,
            lesson: lessonId,
            secondsWatched: 0,
            lastPositionSeconds: 0,
            isCompleted: false
        });
    }

    if (secondsWatched !== undefined && secondsWatched !== null) {
        progress.secondsWatched = Math.max(progress.secondsWatched, Number(secondsWatched));
    }

    if (lastPositionSeconds !== undefined && lastPositionSeconds !== null) {
        progress.lastPositionSeconds = Number(lastPositionSeconds);
    }

    if (isCompleted !== undefined) {
        const markComplete = Boolean(isCompleted);
        if (markComplete && !progress.isCompleted) {
            progress.isCompleted = true;
            progress.completedAt = new Date();
        } else if (!markComplete && progress.isCompleted) {
            progress.isCompleted = false;
            progress.completedAt = null;
        }
    }

    await progress.save();

    if (progress.isCompleted) {
        await recordLessonSkillEvidence(studentId, lessonId);
    }

    // Recalculate enrollment completion percentage and counts
    const completedLessonsCount = await LessonProgress.countDocuments({
        student: studentId,
        course: courseId,
        isCompleted: true
    });

    const totalLessons = await Lesson.countDocuments({ course: courseId });
    const progressPercentage = totalLessons > 0
        ? Math.min(100, Math.round((completedLessonsCount / totalLessons) * 100))
        : 0;

    enrollment.completedLessonsCount = completedLessonsCount;
    enrollment.totalLessonsCount = totalLessons;
    enrollment.progressPercentage = progressPercentage;
    enrollment.lastAccessedLesson = lessonId;
    enrollment.lastAccessedAt = new Date();

    if (progressPercentage === 100) {
        enrollment.status = "completed";
        if (!enrollment.completedAt) {
            enrollment.completedAt = new Date();
        }
    } else {
        if (enrollment.status === "completed") {
            enrollment.status = "active";
            enrollment.completedAt = null;
        }
    }

    await enrollment.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                progress,
                enrollment: {
                    status: enrollment.status,
                    progressPercentage: enrollment.progressPercentage,
                    completedLessonsCount: enrollment.completedLessonsCount,
                    totalLessonsCount: enrollment.totalLessonsCount,
                    completedAt: enrollment.completedAt,
                    lastAccessedAt: enrollment.lastAccessedAt
                }
            },
            "Lesson progress updated successfully"
        )
    );
});

/**
 * Student: Get detailed learning progress breakdown for an entire course.
 */
export const getCourseProgress = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const course = await Course.findById(courseId).select("title slug thumbnail totalLessons totalDuration");
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const enrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId
    });

    // Efficient indexed fetch for syllabus tree & progress
    const chapters = await Chapter.find({ course: courseId }).sort({ order: 1 }).lean();
    const lessons = await Lesson.find({ course: courseId })
        .populate("video", "title duration thumbnail videoFile")
        .sort({ order: 1 })
        .lean();

    const progressRecords = await LessonProgress.find({
        student: studentId,
        course: courseId
    }).lean();

    const progressMap = {};
    progressRecords.forEach((p) => {
        progressMap[p.lesson.toString()] = {
            isCompleted: p.isCompleted,
            secondsWatched: p.secondsWatched,
            lastPositionSeconds: p.lastPositionSeconds,
            completedAt: p.completedAt
        };
    });

    // Map lessons into chapters with individual progress status
    const lessonMapByChapter = {};
    lessons.forEach((l) => {
        const chId = l.chapter.toString();
        if (!lessonMapByChapter[chId]) {
            lessonMapByChapter[chId] = [];
        }
        lessonMapByChapter[chId].push({
            ...l,
            progress: progressMap[l._id.toString()] || {
                isCompleted: false,
                secondsWatched: 0,
                lastPositionSeconds: 0,
                completedAt: null
            }
        });
    });

    const curriculumWithProgress = chapters.map((ch) => ({
        ...ch,
        lessons: lessonMapByChapter[ch._id.toString()] || []
    }));

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                course,
                enrollment: enrollment || {
                    isEnrolled: false,
                    progressPercentage: 0,
                    completedLessonsCount: 0,
                    totalLessonsCount: lessons.length
                },
                chapters: curriculumWithProgress
            },
            "Course learning progress retrieved successfully"
        )
    );
});

/**
 * Student: Continue Learning endpoint.
 * Returns the student's active courses with last accessed or next pending lessons.
 */
export const getContinueLearning = asyncHandler(async (req, res) => {
    const studentId = req.user._id;

    const activeEnrollments = await Enrollment.find({
        student: studentId,
        status: { $in: ["active", "completed"] }
    })
        .populate({
            path: "course",
            select: "title slug thumbnail category level totalLessons totalDuration instructor",
            populate: {
                path: "instructor",
                select: "fullName username avatar"
            }
        })
        .populate("lastAccessedLesson", "title order type duration chapter")
        .sort({ lastAccessedAt: -1 })
        .limit(10);

    const continueLearningList = [];

    for (const enrollment of activeEnrollments) {
        if (!enrollment.course) continue;

        let resumeLesson = enrollment.lastAccessedLesson;

        // If lastAccessedLesson is missing or completed, find the next uncompleted lesson in the course
        if (!resumeLesson) {
            const allLessons = await Lesson.find({ course: enrollment.course._id }).sort({ order: 1 });
            const completedProgress = await LessonProgress.find({
                student: studentId,
                course: enrollment.course._id,
                isCompleted: true
            }).distinct("lesson");

            const completedLessonSet = new Set(completedProgress.map((id) => id.toString()));
            resumeLesson = allLessons.find((l) => !completedLessonSet.has(l._id.toString())) || allLessons[0] || null;
        }

        // Fetch resume playback position
        let playbackProgress = null;
        if (resumeLesson) {
            playbackProgress = await LessonProgress.findOne({
                student: studentId,
                lesson: resumeLesson._id
            }).select("lastPositionSeconds secondsWatched isCompleted");
        }

        continueLearningList.push({
            enrollmentId: enrollment._id,
            course: enrollment.course,
            progressPercentage: enrollment.progressPercentage,
            completedLessonsCount: enrollment.completedLessonsCount,
            totalLessonsCount: enrollment.totalLessonsCount,
            status: enrollment.status,
            lastAccessedAt: enrollment.lastAccessedAt,
            resumeLesson: resumeLesson
                ? {
                      _id: resumeLesson._id,
                      title: resumeLesson.title,
                      order: resumeLesson.order,
                      type: resumeLesson.type,
                      duration: resumeLesson.duration,
                      lastPositionSeconds: playbackProgress?.lastPositionSeconds || 0,
                      isCompleted: playbackProgress?.isCompleted || false
                  }
                : null
        });
    }

    return res.status(200).json(
        new ApiResponse(200, continueLearningList, "Continue learning items retrieved successfully")
    );
});
