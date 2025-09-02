// middlewares/validate.js
import createError from "http-errors";

// Generic validator
const makeValidator = (schema, sourceKey, targetKey) => (req, _res, next) => {
  const result = schema.safeParse(req[sourceKey]);
  if (!result.success) {
    console.error(`❌ Zod validation failed for ${sourceKey}:`, result.error.format());
    return next(createError(400, formatZod(result.error)));
  }
  req[targetKey] = result.data; // store validated data safely
  next();
};

// Validate request body
export const validateBody = (schema) => makeValidator(schema, "body", "validatedBody");

// Validate request query
export const validateQuery = (schema) => makeValidator(schema, "query", "validatedQuery");

// Format Zod error into readable string
function formatZod(err) {
  return err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
}