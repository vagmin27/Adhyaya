import { ApiError } from "../utils/ApiError.js";

/**
 * Higher-order middleware that executes a validator function against `req`.
 * If validation fails, forwards an ApiError(400, "Validation failed", errors) to next().
 *
 * @param {Function} validatorFn - Function receiving `req` and returning an array of `{ field, message }` errors.
 */
export const validate = (validatorFn) => {
    return (req, res, next) => {
        const errors = validatorFn(req);
        if (errors && errors.length > 0) {
            return next(new ApiError(400, "Validation failed", errors));
        }
        next();
    };
};
