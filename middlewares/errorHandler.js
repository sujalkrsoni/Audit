// middlewares/errorHandler.js
import logger from "../utils/logger.js";

export default function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;

  // Default safe message (never leak internals)
  let message =
    status === 500
      ? "Internal Server Error"
      : err.message || "Something went wrong";

  // Zod validation errors (safe to expose)
  if (err.name === "ZodError") {
    const flattened = err.flatten();
    message = Object.entries(flattened.fieldErrors)
      .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
      .join("; ");
    // Override status to 400 for validation errors
    res.status(400);
  }

  // Duplicate key error → generic message
  if (err.code === 11000) {
    message = "Duplicate value error";
  }

  // Log full error (stack, DB info, etc.) internally only
  logger.error("🔥 Error handler caught", {
    status,
    message: err.message,
    stack: err.stack,
    code: err.code,
    details: err.keyValue || null,
  });

  // Send sanitized error response
  res.status(res.statusCode || status).json({
    success: false,
    error: message,
  });
}
