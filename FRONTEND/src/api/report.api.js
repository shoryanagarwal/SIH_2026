

import reportClient from "./reportClient.js";

function normalizeError(error) {
  const message =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong";
  const normalized = new Error(message);
  normalized.status = error.response?.status;
  normalized.original = error;
  return normalized;
}

/**
 * POST /api/reports/upload
 * Multipart upload, field name "file".
 *
 * @param {File} file
 * @param {(progressEvent) => void} [onUploadProgress]
 */
export async function uploadReport(file, onUploadProgress) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await reportClient.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}