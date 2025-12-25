import express from "express";
import userRoutes from "./routes/user.js";
import { consoleLogger, requestLogger } from "./utils/logger.js";

const app = express();

// Request logging - log to file
app.use(requestLogger);

// Also log to console in development
if (process.env.NODE_ENV !== "production") {
  app.use(consoleLogger);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/user", userRoutes);

export default app;
