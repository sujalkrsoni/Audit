import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

const logger = pino({
  level: isProd ? "info" : "debug",
  transport: !isProd
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

// ❌ Don’t attach `.on("error")` — pino streams don’t need it.
// That handler was swallowing logs and surfacing “failed with status code 500”.

export default logger;
