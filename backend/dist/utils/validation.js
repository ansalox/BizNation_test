"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidSchema = void 0;
exports.parseWithSchema = parseWithSchema;
exports.parseUuid = parseUuid;
const zod_1 = require("zod");
const errorHandler_1 = require("../middlewares/errorHandler");
exports.uuidSchema = zod_1.z.uuid('Invalid UUID identifier');
function parseWithSchema(schema, input) {
    const result = schema.safeParse(input);
    if (!result.success) {
        const details = result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
        }));
        throw new errorHandler_1.AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
    }
    return result.data;
}
function parseUuid(value, fieldName = 'id') {
    const result = exports.uuidSchema.safeParse(value);
    if (!result.success) {
        throw new errorHandler_1.AppError(`Invalid UUID for parameter '${fieldName}'`, 400, 'VALIDATION_ERROR', [
            { path: fieldName, message: result.error.issues[0]?.message ?? 'Invalid UUID' },
        ]);
    }
    return result.data;
}
//# sourceMappingURL=validation.js.map