import type { Request, Response, NextFunction, RequestHandler } from "express";
import { ErrorHandler } from "./error-handler.js";

export const tryCatch =
  (
    controller: (
      req: Request,
      res: Response,
      next: NextFunction
    ) => Promise<any>
  ): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller(req, res, next);
    } catch (error: any) {
      if (error instanceof ErrorHandler) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        console.log("[USER SERVICE] error handler", error);
        res
          .status(500)
          .json({ error: "Internal server error", stack: error.message });
      }
    }
  };
