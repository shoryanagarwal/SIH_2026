import { useState } from "react";
import { analyzeCsv } from "../api/screening.api.js";

function DataUpload({ onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

const allowedExtensions = [".csv"];
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const extension = "." + file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setError("Please select a CSV, Excel or JSON file.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError("");
  };

  const handleUpload = async () => {
  if (!selectedFile) {
    setError("Please select a file first.");
    return;
  }

  try {
    setUploading(true);
    setError("");

    console.log("Uploading:", selectedFile.name);

    const response = await analyzeCsv(selectedFile);

    console.log("Screening analysis:", response);

    if (!response.success) {
      throw new Error("Screening analysis failed.");
    }

    onClose();

    // Refresh page so Dashboard loads latest analysis
    window.location.reload();

  } catch (error) {
    console.error("Upload failed:", error);
    setError(error.message || "Failed to analyze file.");
  } finally {
    setUploading(false);
  }
};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

      <div className="w-full max-w-lg rounded-2xl border border-blue-400/20 bg-slate-950 p-6 shadow-2xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              Upload Screening Data
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Upload component screening data for AI analysis
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-xl text-slate-500 transition hover:text-slate-200"
          >
            ×
          </button>
        </div>

        {/* Upload Area */}
        <label
          className="flex cursor-pointer flex-col items-center justify-center
          rounded-xl border border-dashed border-blue-400/30
          bg-slate-900/60 px-6 py-10
          transition hover:border-blue-400/60 hover:bg-slate-900"
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-2xl text-blue-400">
            ↑
          </div>

          <p className="text-sm font-medium text-slate-200">
            Click to select a file
          </p>

          <p className="mt-2 text-xs text-slate-500">
            CSV
          </p>
        </label>

        {/* Error */}
        {error && (
          <p className="mt-3 text-xs text-red-400">
            {error}
          </p>
        )}

        {/* Selected File */}
        {selectedFile && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-200">
                {selectedFile.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>

            <button
              onClick={removeFile}
              className="ml-4 text-sm text-red-400 hover:text-red-300"
            >
              Remove
            </button>

          </div>
        )}

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700
            px-4 py-2 text-sm text-slate-300
            transition hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="rounded-lg bg-blue-600
            px-5 py-2 text-sm font-medium text-white
            transition hover:bg-blue-500
            disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Analyzing..." : "Upload Data"}
        </button>

        </div>

      </div>
    </div>
  );
}

export default DataUpload;