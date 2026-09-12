import bgImage from "../assets/image.png";

function ModelInsights() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed text-white"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      {/* Dark Overlay */}
      <div className="min-h-screen bg-slate-950/75">

        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">

          {/* Header */}
          <div className="mb-10">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.25em] text-blue-400">
              TRACE-X AI
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Model Insights
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Understand how TRACE-X AI processes Burn-In data,
              detects latent anomalies, predicts 168h behavior,
              and generates reliability insights.
            </p>
          </div>

          {/* Pipeline */}
          <section className="mb-10">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">
                How TRACE-X AI Works
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                End-to-end screening pipeline
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

              <PipelineCard
                number="01"
                title="Data Ingestion"
                description="CSV containing component-level Burn-In measurements is uploaded."
                icon="↑"
              />

              <PipelineCard
                number="02"
                title="Feature Engineering"
                description="Raw time-series measurements are transformed into model-ready features."
                icon="⚙"
              />

              <PipelineCard
                number="03"
                title="Anomaly Detection"
                description="Isolation Forest identifies components showing unusual behavior."
                icon="◈"
              />

              <PipelineCard
                number="04"
                title="168h Prediction"
                description="LSTM learns temporal behavior and predicts future component parameters."
                icon="⌁"
              />

            </div>

            <div className="my-5 hidden items-center justify-center lg:flex">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              <PipelineCard
                number="05"
                title="Drift Analysis"
                description="Parameter changes across Burn-In stages are analyzed to identify degradation trends."
                icon="↗"
              />

              <PipelineCard
                number="06"
                title="Risk Scoring"
                description="Anomaly, prediction and drift signals are combined into a reliability risk assessment."
                icon="!"
              />

              <PipelineCard
                number="07"
                title="AI Report"
                description="The analysis is converted into an explainable reliability report with recommended actions."
                icon="▣"
              />

            </div>
          </section>

          {/* Models */}
          <section className="mb-10">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">
                Core AI Models
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Two complementary models work together.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">

              {/* Isolation Forest */}
              <ModelCard
                title="Isolation Forest"
                subtitle="Anomaly Detection"
                badge="ML"
                icon="◈"
              >
                <InfoRow
                  label="Purpose"
                  value="Detect unusual or potentially defective component behavior."
                />

                <InfoRow
                  label="Input"
                  value="Engineered features derived from Burn-In measurements."
                />

                <InfoRow
                  label="Working"
                  value="Components that are easier to isolate from the normal population receive higher anomaly scores."
                />

                <InfoRow
                  label="Output"
                  value="Anomaly score and screening status."
                />
              </ModelCard>

              {/* LSTM */}
              <ModelCard
                title="LSTM Neural Network"
                subtitle="168h Prediction"
                badge="DL"
                icon="⌁"
              >
                <InfoRow
                  label="Purpose"
                  value="Predict future parameter values from historical Burn-In behavior."
                />

                <InfoRow
                  label="Input"
                  value="Temperature, VCE, Leakage and Breakdown values across 0h, 24h, 48h and 96h."
                />

                <InfoRow
                  label="Working"
                  value="Learns temporal dependencies between measurements across Burn-In stages."
                />

                <InfoRow
                  label="Output"
                  value="Predicted Temperature, VCE, Leakage and Breakdown at 168h."
                />
              </ModelCard>

            </div>
          </section>

          {/* Background Process */}
          <section className="mb-10">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">
                Background Processing
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                What happens after a CSV is uploaded?
              </p>
            </div>

            <div className="rounded-2xl border border-blue-400/15 bg-slate-900/60 p-6 backdrop-blur-xl">

              <ProcessStep
                number="01"
                title="Upload & Validation"
                description="The backend receives the CSV, validates its structure and extracts component-level time-series data."
              />

              <ProcessStep
                number="02"
                title="Parallel ML Analysis"
                description="Each component is sent to the ML service for anomaly detection and 168h prediction."
              />

              <ProcessStep
                number="03"
                title="Reliability Analysis"
                description="The backend calculates parameter drift and combines model outputs to determine component and batch risk."
              />

              <ProcessStep
                number="04"
                title="Data Persistence"
                description="The completed screening analysis is stored so that it can be accessed later through Screening History."
              />

              <ProcessStep
                number="05"
                title="AI Report Generation"
                description="Flagged components and analysis results are processed to generate an explainable reliability report."
                last
              />

            </div>
          </section>

          {/* Time Series */}
          <section className="mb-10">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">
                Time-Series Analysis
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Burn-In measurements used by the prediction pipeline
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <TimeCard
                time="0h"
                title="Initial"
                description="Baseline component measurements"
              />

              <TimeCard
                time="24h"
                title="Early Burn-In"
                description="Early behavioral changes"
              />

              <TimeCard
                time="48h"
                title="Mid Burn-In"
                description="Emerging degradation patterns"
              />

              <TimeCard
                time="96h"
                title="Late Burn-In"
                description="Observed behavior before prediction"
              />

            </div>

            <div className="mt-4 rounded-xl border border-blue-400/15 bg-blue-500/5 p-5 backdrop-blur-xl">

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                <div>
                  <p className="text-xs uppercase tracking-wider text-blue-400">
                    Prediction Horizon
                  </p>

                  <h3 className="mt-1 text-lg font-semibold text-white">
                    168h
                  </h3>
                </div>

                <p className="max-w-2xl text-sm leading-6 text-slate-400">
                  The LSTM model uses the observed Burn-In sequence
                  to estimate future component behavior at the 168-hour
                  checkpoint.
                </p>

              </div>

            </div>
          </section>

          {/* Final Flow */}
          <section>

            <div className="rounded-2xl border border-blue-400/15 bg-slate-900/60 p-6 backdrop-blur-xl">

              <p className="text-xs uppercase tracking-[0.2em] text-blue-400">
                End-to-End Flow
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">

                <FlowItem text="CSV" />
                <Arrow />
                <FlowItem text="Validation" />
                <Arrow />
                <FlowItem text="Features" />
                <Arrow />
                <FlowItem text="Isolation Forest" />
                <Arrow />
                <FlowItem text="LSTM" />
                <Arrow />
                <FlowItem text="Risk Score" />
                <Arrow />
                <FlowItem text="AI Report" />

              </div>

            </div>

          </section>

        </div>
      </div>
    </div>
  );
}


/* =========================
   Reusable Components
========================= */

function PipelineCard({
  number,
  title,
  description,
  icon,
}) {
  return (
    <div className="group rounded-xl border border-blue-400/15 bg-slate-900/60 p-5 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-slate-800/70">

      <div className="flex items-start justify-between">

        <div>
          <span className="text-[10px] font-medium tracking-widest text-blue-400">
            {number}
          </span>

          <h3 className="mt-3 text-sm font-semibold text-white">
            {title}
          </h3>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            {description}
          </p>
        </div>

        <div className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
          {icon}
        </div>

      </div>

    </div>
  );
}


function ModelCard({
  title,
  subtitle,
  badge,
  icon,
  children,
}) {
  return (
    <div className="rounded-2xl border border-blue-400/15 bg-slate-900/60 p-6 backdrop-blur-xl">

      <div className="mb-6 flex items-start justify-between">

        <div className="flex items-center gap-4">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-xl text-blue-400">
            {icon}
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              {title}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {subtitle}
            </p>
          </div>

        </div>

        <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[10px] font-medium text-blue-400">
          {badge}
        </span>

      </div>

      <div className="space-y-4">
        {children}
      </div>

    </div>
  );
}


function InfoRow({ label, value }) {
  return (
    <div className="border-t border-slate-800/70 pt-4">

      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm leading-6 text-slate-300">
        {value}
      </p>

    </div>
  );
}


function ProcessStep({
  number,
  title,
  description,
  last,
}) {
  return (
    <div className="flex gap-4">

      <div className="flex flex-col items-center">

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10 text-xs font-medium text-blue-400">
          {number}
        </div>

        {!last && (
          <div className="mt-2 h-full w-px bg-slate-700/60" />
        )}

      </div>

      <div className="pb-7">

        <h3 className="text-sm font-semibold text-white">
          {title}
        </h3>

        <p className="mt-1 max-w-3xl text-xs leading-6 text-slate-400">
          {description}
        </p>

      </div>

    </div>
  );
}


function TimeCard({
  time,
  title,
  description,
}) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5 backdrop-blur-xl">

      <span className="text-lg font-semibold text-blue-400">
        {time}
      </span>

      <h3 className="mt-2 text-sm font-medium text-white">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>

    </div>
  );
}


function FlowItem({ text }) {
  return (
    <div className="rounded-lg border border-blue-400/15 bg-blue-500/5 px-3 py-2 text-xs text-slate-300">
      {text}
    </div>
  );
}


function Arrow() {
  return (
    <span className="text-blue-400">
      →
    </span>
  );
}

export default ModelInsights;