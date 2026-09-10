

import axios, { AxiosError, AxiosInstance } from "axios";
import {
  ParsedComponent,
  MlAnomalyResponse,
  MlPredict168Response,
} from "../types/screening.types.js";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";
const ML_SERVICE_TIMEOUT_MS = Number(process.env.ML_SERVICE_TIMEOUT_MS || 15000);

const client: AxiosInstance = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: ML_SERVICE_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});


export class MlServiceError extends Error {
  code: "ML_SERVICE_UNAVAILABLE" | "ML_SERVICE_ERROR";
  componentId?: string;
  statusCode: number;

  constructor(
    message: string,
    code: "ML_SERVICE_UNAVAILABLE" | "ML_SERVICE_ERROR",
    statusCode = 502,
    componentId?: string
  ) {
    super(message);
    this.name = "MlServiceError";
    this.code = code;
    this.statusCode = statusCode;
    this.componentId = componentId;
  }
}

function toMlServiceError(err: unknown, componentId: string): MlServiceError {
  const axiosErr = err as AxiosError<{ detail?: string }>;

  // Server never responded at all — service down, wrong port, network issue
  if (!axiosErr.response) {
    return new MlServiceError(
      `ML service unreachable at ${ML_SERVICE_URL}. Is uvicorn running?`,
      "ML_SERVICE_UNAVAILABLE",
      503,
      componentId
    );
  }

  // Server responded with an error (400/500) 
  const detail = axiosErr.response.data?.detail || axiosErr.message;
  return new MlServiceError(
    `ML service rejected component ${componentId}: ${detail}`,
    "ML_SERVICE_ERROR",
    axiosErr.response.status,
    componentId
  );
}

function toMlPayload(component: ParsedComponent) {
  return {
    component_id: component.component_id,
    lot_id: component.lot_id,
    Temperature: component.Temperature,
    VCE: component.VCE,
    Leakage: component.Leakage,
    Breakdown: component.Breakdown,
  };
}

export async function getAnomaly(
  component: ParsedComponent
): Promise<MlAnomalyResponse> {
  try {
    const { data } = await client.post<MlAnomalyResponse>(
      "/anomaly",
      toMlPayload(component)
    );
    return data;
  } catch (err) {
    throw toMlServiceError(err, component.component_id);
  }
}

export async function getPrediction168(
  component: ParsedComponent
): Promise<MlPredict168Response> {
  try {
    const { data } = await client.post<MlPredict168Response>(
      "/predict168",
      toMlPayload(component)
    );
    return data;
  } catch (err) {
    throw toMlServiceError(err, component.component_id);
  }
}


export async function analyzeComponentMl(component: ParsedComponent): Promise<{
  anomaly: MlAnomalyResponse;
  prediction: MlPredict168Response;
}> {
  const [anomaly, prediction] = await Promise.all([
    getAnomaly(component),
    getPrediction168(component),
  ]);
  return { anomaly, prediction };
}

/**
 * Simple reachability check for GET /api/v1/health to report on,
 * and useful to call once at server.ts startup 
 */
export async function pingMlService(): Promise<boolean> {
  try {
    const { data } = await client.get("/health", { timeout: 3000 });
    return data?.success === true;
  } catch {
    return false;
  }
}