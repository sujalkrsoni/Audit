import mongoose from "mongoose";
import { env } from "./validateEnv.js";
import logger from "../utils/logger.js";

export async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI);
  logger.info("MongoDB connected");
}
