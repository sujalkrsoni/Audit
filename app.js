// app.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import pinoHttp from "pino-http";

import { env } from "./config/validateEnv.js";
import errorHandler from "./middlewares/errorHandler.js";
import logger from "./utils/logger.js";

// routes
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import savedSearchRoutes from "./routes/savedSearchRoutes.js";
import aggregationRoutes from "./routes/aggregationRoutes.js"; // ✅ NEW

const app = express();

// 🔒 security & basics
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// 📜 structured logging (replaces morgan)
app.use(
  pinoHttp({
    logger,
    autoLogging: env.NODE_ENV !== "test",
    customLogLevel: function (res, err) {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  })
);

// 🗂 static/public folder setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// 🚏 routes
app.use("/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/logs", logRoutes);
app.use("/api/v1/saved-searches", savedSearchRoutes);
app.use("/api/v1/aggregations", aggregationRoutes); // ✅ NEW

// centralized error handler
app.use(errorHandler);

export default app;
