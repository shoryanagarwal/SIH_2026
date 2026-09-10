

import { Request, Response, NextFunction } from "express";
import { ApiError, ErrorCode } from "../types/screening.types.js";

interface KnownAppError extends Error {
  code?: string;
  statusCode?: number;
}

const KNOWN_ERROR_CODES: ErrorCode[] = [
  "NO_FILE",
  "INVALID_CSV",
  "MISSING_COLUMN",
  "MALFORMED_VALUE",
  "CLOUDINARY_UPLOAD_FAILED",
  "ML_SERVICE_ERROR",
  "ML_SERVICE_UNAVAILABLE",
  "ANALYSIS_NOT_FOUND",
  "REPORT_GENERATION_FAILED",
  "INTERNAL_ERROR",
];

function isKnownErrorCode(code: unknown): code is ErrorCode {
  return typeof code === "string" && (KNOWN_ERROR_CODES as string[]).includes(code);
}

// eslint-disable-next-line @typescript-esline this as an error handler
export function errorMiddleware(err: KnownAppError, _req: Request, res: Response, _next: NextFunction): void {
  const code: ErrorCode = isKnownErrorCode(err.code) ? err.code : "INTERNAL_ERROR";
  const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;

  // Unrecognized errors are 
  if (code === "INTERNAL_ERROR") {
    console.error("[unhandled error]", err);
  }

  const body: ApiError = {
    success: false,
    error: {
      code,
      message: code === "INTERNAL_ERROR" ? "Something went wrong processing this request." : err.message,
    },
  };

  res.status(statusCode).json(body);
}