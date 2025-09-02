// middlewares/errorHandler.js
export default function errorHandler(err, _req, res, _next) {
  console.error("🔥 Error handler caught:", err);

  const status = err.status || 500;
  let message = err.message || "Internal Server Error";

  // Zod validation errors
  if (err.errors && Array.isArray(err.errors)) {
    message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    message = `Duplicate key error: ${JSON.stringify(err.keyValue)}`;
  }

  res.status(status).json({
    error: message,
  });
}
