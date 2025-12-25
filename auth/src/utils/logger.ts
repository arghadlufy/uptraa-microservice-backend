import fs from "fs";
import path from "path";
import morgan from "morgan";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a write stream for appending to access.log
const accessLogStream = fs.createWriteStream(path.join(logsDir, "access.log"), {
  flags: "a",
});

// Define custom token for timestamp
morgan.token("timestamp", () => {
  return new Date().toISOString();
});

// Custom format for logging
const logFormat =
  ":timestamp :method :url :status :response-time ms - :res[content-length]";

// Create the logger middleware
export const requestLogger = morgan(logFormat, {
  stream: accessLogStream,
  // Also log to console in development
  skip: (req, res) => {
    return process.env.NODE_ENV === "production";
  },
});

// For console logging in development
export const consoleLogger = morgan(logFormat);
