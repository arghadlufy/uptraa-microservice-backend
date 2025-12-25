import express from "express";
import authRoutes from "./routes/auth.js";
import { consoleLogger, requestLogger } from "./utils/logger.js";
import { connectKafka } from "./producer.js";

const app = express();

// Request logging - log to file
app.use(requestLogger);

// Also log to console in development
if (process.env.NODE_ENV !== "production") {
  app.use(consoleLogger);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectKafka();

app.use("/api/auth", authRoutes);

export default app;
