import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message =
    statusCode < 500
      ? err.message
      : "An unexpected error occurred. Please try again.";

  if (statusCode >= 500) {
    console.error("[Server Error]", err);
  }

  res.status(statusCode).json({ error: message });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Route not found." });
}
