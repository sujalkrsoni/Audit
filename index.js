// index.js
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

  // Restart worker if it dies
  cluster.on("exit", (worker) => {
    logger.error(`❌ Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });

} else {
  // Worker processes have their own server
  connectDB().then(() => {
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Worker ${process.pid} running on port ${PORT}`);
    });

    // Graceful shutdown inside workers
    const shutdown = async () => {
      logger.warn(`👋 Worker ${process.pid} shutting down...`);
      await mongoose.connection.close();
      server.close(() => process.exit(0));
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  });
}
