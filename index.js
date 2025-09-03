import cluster from "cluster";
import os from "os";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { env } from "./config/validateEnv.js";
import app from "./app.js";
import logger from "./utils/logger.js";

const numCPUs = os.cpus().length;
const PORT = env.PORT;

if (cluster.isPrimary) {
  logger.info(`🟢 Primary process ${process.pid} is running`);
  logger.info(`Spawning ${numCPUs} workers...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("online", (worker) => {
    logger.info(`✅ Worker ${worker.process.pid} started`);
  });

  // Restart worker if it dies
  cluster.on("exit", (worker, code, signal) => {
    logger.error(
      `❌ Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Restarting...`
    );
    cluster.fork();
  });

  // Catch unhandled promise rejections at primary level
  process.on("unhandledRejection", (reason) => {
    logger.error({ msg: "Unhandled Rejection in primary", reason });
  });

} else {
  // Worker processes have their own server
  connectDB().then(() => {
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Worker ${process.pid} running on port ${PORT}`);
    });

    const shutdown = async () => {
      logger.warn(`👋 Worker ${process.pid} shutting down...`);
      try {
        await mongoose.connection.close();
        server.close(() => process.exit(0));
      } catch (err) {
        logger.error({ msg: "Error during shutdown", error: err.message });
        process.exit(1);
      }
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("beforeExit", shutdown);

    process.on("unhandledRejection", (reason) => {
      logger.error({ msg: "Unhandled Rejection in worker", reason });
    });
    process.on("uncaughtException", (err) => {
      logger.error({ msg: "Uncaught Exception in worker", error: err.message, stack: err.stack });
      shutdown();
    });
  });
}
