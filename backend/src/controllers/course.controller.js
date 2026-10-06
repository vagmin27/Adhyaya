import mongoose, { isValidObjectId } from "mongoose";
import { Course } from "../models/course.model.js";
import { Chapter } from "../models/chapter.model.js";
import { Lesson } from "../models/lesson.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Generate a clean, URL-friendly unique slug from title.
 */
const generateSlug = async (title) => {
    const baseSlug = String(title)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    let candidate = baseSlug || "course";
    let count = 0;

    while (await Course.exists({ slug: candidate })) {
        count += 1;
        candidate = `${baseSlug}-${count}-${Date.now().toString(36).slice(-4)}`;
    }

    return candidate;
};

/**
 * Public: Get paginated list of courses with filtering.
 */
export const getAllCourses = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        category,
        level,
        instructorId,
        sortBy = "createdAt",
        sortType = "desc"
    } = req.query;

    const matchConditions = {};

    // For public / non-privileged requests, show published courses only.
    // If instructor requests their own courses, allow viewing unpublished as well.
    const isPrivileged = req.user && (req.user.role === "admin" || (instructorId && req.user._id.toString() === instructorId.toString()));

    if (!isPrivileged) {
        matchConditions.isPublished = true;
    }

    if (query && typeof query === "string" && query.trim() !== "") {
        matchConditions.$or = [
            { title: { $regex: query.trim(), $options: "i" } },
            { description: { $regex: query.trim(), $options: "i" } }
        ];
    }

    if (category && typeof category === "string" && category.trim() !== "") {
        matchConditions.category = { $regex: `^${category.trim()}$`, $options: "i" };
    }

    if (level && typeof level === "string" && level.trim() !== "") {
        matchConditions.level = level.trim();
    }

    if (instructorId && isValidObjectId(instructorId)) {
        matchConditions.instructor = new mongoose.Types.ObjectId(instructorId);
    }

    const sortOrder = String(sortType).toLowerCase() === "asc" ? 1 : -1;

    const aggregate = Course.aggregate([
        { $match: matchConditions },
        {
            $lookup: {
                from: "users",
                localField: "instructor",
                foreignField: "_id",
                as: "instructor",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                instructor: { $first: "$instructor" }
            }
        },
        {
            $sort: {
                [sortBy]: sortOrder
            }
        }
    ]);

    const result = await Course.aggregatePaginate(aggregate, {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10
    });

    return res.status(200).json(
        new ApiResponse(200, result, "Courses fetched successfully")
    );
});

/**
 * Public: Get course details along with structured curriculum tree (chapters & lessons).
 */
export const getCourseById = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const query = isValidObjectId(courseId)
        ? { _id: courseId }
        : { slug: courseId.toLowerCase().trim() };

    const course = await Course.findOne(query).populate("instructor", "fullName username avatar bio");

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Access control for draft / unpublished courses
    if (!course.isPublished) {
        const isOwnerOrAdmin =
            req.user &&
            (req.user.role === "admin" ||
                req.user._id.toString() === course.instructor._id.toString());

        if (!isOwnerOrAdmin) {
            throw new ApiError(404, "Course not found or is currently not published");
        }
    }

    // Efficient curriculum loading: 2 indexed queries, zero N+1
    const chapters = await Chapter.find({ course: course._id }).sort({ order: 1 }).lean();
    const lessons = await Lesson.find({ course: course._id })
        .populate("video", "title duration thumbnail videoFile views")
        .sort({ order: 1 })
        .lean();

    // Map lessons into their respective chapters
    const lessonMapByChapter = {};
    lessons.forEach((lesson) => {
        const chId = lesson.chapter.toString();
        if (!lessonMapByChapter[chId]) {
            lessonMapByChapter[chId] = [];
        }
        lessonMapByChapter[chId].push(lesson);
    });

    const curriculum = chapters.map((chapter) => ({
        ...chapter,
        lessons: lessonMapByChapter[chapter._id.toString()] || []
    }));

    const responseData = {
        course,
        instructor: course.instructor,
        chapters: curriculum
    };

    return res.status(200).json(
        new ApiResponse(200, responseData, "Course retrieved successfully")
    );
});

/**
 * Instructor/Admin: Create a new course.
 */
export const createCourse = asyncHandler(async (req, res) => {
    const { title, subtitle, description, thumbnail, category, level, tags, slug } = req.body;

    let courseSlug;
    if (slug && typeof slug === "string" && slug.trim() !== "") {
        const cleanedSlug = slug.trim().toLowerCase();
        const existing = await Course.findOne({ slug: cleanedSlug });
        if (existing) {
            throw new ApiError(409, `Course with slug '${cleanedSlug}' already exists`);
        }
        courseSlug = cleanedSlug;
    } else {
        courseSlug = await generateSlug(title);
    }

    const course = await Course.create({
        title: title.trim(),
        slug: courseSlug,
        subtitle: subtitle ? subtitle.trim() : "",
        description: description ? description.trim() : "",
        thumbnail: thumbnail || "",
        instructor: req.user._id,
        category: category ? category.trim() : "General",
        level: level || "all_levels",
        tags: Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : [],
        isPublished: false,
        totalDuration: 0,
        totalLessons: 0
    });

    const createdCourse = await Course.findById(course._id).populate(
        "instructor",
        "fullName username avatar"
    );

    return res.status(201).json(
        new ApiResponse(201, createdCourse, "Course created successfully")
    );
});

/**
 * Instructor/Admin: Update course metadata.
 */
export const updateCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, subtitle, description, thumbnail, category, level, tags, slug } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Ownership check: must be course instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to modify this course");
    }

    if (slug && typeof slug === "string") {
        const cleanedSlug = slug.trim().toLowerCase();
        if (cleanedSlug !== course.slug) {
            const existing = await Course.findOne({ slug: cleanedSlug });
            if (existing) {
                throw new ApiError(409, `Course with slug '${cleanedSlug}' already exists`);
            }
            course.slug = cleanedSlug;
        }
    }

    if (title !== undefined) course.title = title.trim();
    if (subtitle !== undefined) course.subtitle = subtitle.trim();
    if (description !== undefined) course.description = description.trim();
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    if (category !== undefined) course.category = category.trim();
    if (level !== undefined) course.level = level;
    if (tags !== undefined) {
        course.tags = Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : [];
    }

    await course.save();

    const updated = await Course.findById(course._id).populate("instructor", "fullName username avatar");

    return res.status(200).json(
        new ApiResponse(200, updated, "Course updated successfully")
    );
});

/**
 * Instructor/Admin: Toggle course publication status.
 */
export const toggleCoursePublish = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to publish/unpublish this course");
    }

    course.isPublished = !course.isPublished;
    await course.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            { courseId: course._id, isPublished: course.isPublished },
            `Course ${course.isPublished ? "published" : "unpublished"} successfully`
        )
    );
});

/**
 * Instructor/Admin: Safe deletion of course.
 * Protects against accidental deletion if curriculum exists unless force=true.
 */
export const deleteCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const force = req.query?.force === "true" || req.body?.force === true;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to delete this course");
    }

    const chapterCount = await Chapter.countDocuments({ course: courseId });

    if (chapterCount > 0 && !force) {
        throw new ApiError(
            400,
            `Course has ${chapterCount} chapter(s). Please delete chapters first or pass ?force=true to cascade delete all curriculum.`
        );
    }

    // Cascade delete curriculum if allowed or empty
    await Lesson.deleteMany({ course: courseId });
    await Chapter.deleteMany({ course: courseId });
    await Course.findByIdAndDelete(courseId);

    return res.status(200).json(
        new ApiResponse(200, { deletedCourseId: courseId }, "Course and curriculum deleted successfully")
    );
});
