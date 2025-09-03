import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

const logger = pino({
  level: isProd ? "info" : "debug",
  timestamp: pino.stdTimeFunctions.isoTime, // ✅ always readable timestamps
  redact: {
    paths: ["req.headers.authorization", "password", "apiKey"], // ✅ no secrets in logs
    censor: "[REDACTED]",
  },
  serializers: {
    err: pino.stdSerializers.err, // ✅ proper error stack logging
  },
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

export default logger;
