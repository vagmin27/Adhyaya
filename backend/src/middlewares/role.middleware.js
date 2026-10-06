import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware factory for role-based access control (RBAC).
 * Must be executed after verifyJWT middleware.
 *
 * @param {...string} roles - Allowed role names (e.g. "instructor", "admin")
 * @returns {Function} Express middleware function
 *
 * Example usage:
 *   router.post("/", verifyJWT, authorizeRoles("instructor", "admin"), controller);
 */
export const authorizeRoles = (...roles) => {
    return (req, _, next) => {
        if (!req.user) {
            return next(new ApiError(401, "Unauthorized request: Authentication required"));
        }

        const userRole = req.user.role || "student";

        if (!roles.includes(userRole)) {
            return next(
                new ApiError(
                    403,
                    `Access forbidden: Role '${userRole}' is not authorized to access this resource`
                )
            );
        }

        next();
    };
};
