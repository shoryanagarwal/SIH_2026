

import apiClient from "./client.js";

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


export async function getHealth() {
  try {
    const response = await apiClient.get("/health");
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * GET /api/v1/models/performance
 */
export async function getModelPerformance() {
  try {
    const response = await apiClient.get("/models/performance");
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}



export async function analyzeCsv(file, onUploadProgress) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/screening/analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * GET /api/v1/screening/history
 * @param {number} [limit]
 * @param {number} [skip]
 */
export async function getScreeningHistory(limit, skip) {
  try {
    const response = await apiClient.get("/screening/history", {
      params: { limit, skip },
    });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}


export async function getScreeningById(id) {
  try {
    const response = await apiClient.get(`/screening/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}


 
export async function generateReport(id) {
  try {
    const response = await apiClient.post(`/screening/${id}/report`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}