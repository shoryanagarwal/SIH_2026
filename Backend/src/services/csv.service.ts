

import { parse } from "csv-parse/sync";
import {
  ParsedComponent,
  ParamName,
  PARAM_ORDER,
  INPUT_STAGES,
} from "../types/screening.types.js";

export class CsvValidationError extends Error {
  code: "INVALID_CSV" | "MISSING_COLUMN" | "MALFORMED_VALUE";

  constructor(
    message: string,
    code: "INVALID_CSV" | "MISSING_COLUMN" | "MALFORMED_VALUE" = "INVALID_CSV"
  ) {
    super(message);
    this.name = "CsvValidationError";
    this.code = code;
  }
}

// Maps our clean param names
const PARAM_COLUMN_PREFIX: Record<ParamName, string> = {
  Temperature: "Temperature_C",
  VCE: "VCE",
  Leakage: "Leakage_uA",
  Breakdown: "Breakdown_V",
};

function requiredColumns(): string[] {
  const base = ["Component_ID", "Lot_ID"];
  const paramCols = PARAM_ORDER.flatMap((param) =>
    INPUT_STAGES.map((stage) => `${PARAM_COLUMN_PREFIX[param]}_${stage}`)
  );
  return [...base, ...paramCols];
}

function optionalColumn168(param: ParamName): string {
  return `${PARAM_COLUMN_PREFIX[param]}_168h`;
}


function validateHeaders(headers: string[]): void {
  const missing = requiredColumns().filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    throw new CsvValidationError(
      `CSV is missing required column(s): ${missing.join(", ")}`,
      "MISSING_COLUMN"
    );
  }
}

function parseNumericCell(
  raw: string | undefined,
  columnName: string,
  rowIndex: number
): number {
  if (raw === undefined || raw === "" || raw === null) {
    throw new CsvValidationError(
      `Row ${rowIndex + 1}: missing value in column "${columnName}"`,
      "MALFORMED_VALUE"
    );
  }
  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new CsvValidationError(
      `Row ${rowIndex + 1}: non-numeric value "${raw}" in column "${columnName}"`,
      "MALFORMED_VALUE"
    );
  }
  return value;
}

/**
 * Parses the raw CSV buffer (from multer's memoryStorage) 
 */
export function parseCsvBuffer(buffer: Buffer): ParsedComponent[] {
  let records: Record<string, string>[];

  try {
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    throw new CsvValidationError(
      `Failed to parse CSV: ${(err as Error).message}`,
      "INVALID_CSV"
    );
  }

  if (records.length === 0) {
    throw new CsvValidationError("CSV file is empty.", "INVALID_CSV");
  }

  validateHeaders(Object.keys(records[0]));

  const components: ParsedComponent[] = records.map((row, rowIndex) => {
    const component_id = row["Component_ID"]?.trim();
    const lot_id = row["Lot_ID"]?.trim();

    if (!component_id) {
      throw new CsvValidationError(
        `Row ${rowIndex + 1}: missing Component_ID`,
        "MALFORMED_VALUE"
      );
    }
    if (!lot_id) {
      throw new CsvValidationError(
        `Row ${rowIndex + 1}: missing Lot_ID`,
        "MALFORMED_VALUE"
      );
    }

    const paramValues: Record<ParamName, number[]> = {
      Temperature: [],
      VCE: [],
      Leakage: [],
      Breakdown: [],
    };

    for (const param of PARAM_ORDER) {
      paramValues[param] = INPUT_STAGES.map((stage) => {
        const columnName = `${PARAM_COLUMN_PREFIX[param]}_${stage}`;
        return parseNumericCell(row[columnName], columnName, rowIndex);
      });
    }

    // Optional 168h ground-truth values
    const actual_168h: Partial<Record<ParamName, number>> = {};
    for (const param of PARAM_ORDER) {
      const col168 = optionalColumn168(param);
      const raw = row[col168];
      if (raw !== undefined && raw !== "") {
        const val = Number(raw);
        if (!Number.isNaN(val)) {
          actual_168h[param] = val;
        }
      }
    }

    const component: ParsedComponent = {
      component_id,
      lot_id,
      Temperature: paramValues.Temperature,
      VCE: paramValues.VCE,
      Leakage: paramValues.Leakage,
      Breakdown: paramValues.Breakdown,
    };

    if (Object.keys(actual_168h).length > 0) {
      component.actual_168h = actual_168h;
    }

    return component;
  });

  return components;
}