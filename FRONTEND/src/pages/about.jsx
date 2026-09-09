import Header from "../components/Header.jsx";

function About() {
  const teamMembers = [
    {
      name: "Shoryan Agarwal",
      role: "Team Captain",
    },
    {
      name: "Snehil Kumar",
      role: "Team Member",
    },
    {
      name: "Rudra Sahu",
      role: "Team Member",
    },
    {
      name: "Ayush Chaurasia",
      role: "Team Member",
    },
    {
      name: "Harsh Srivastava",
      role: "Team Member",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Common Header */}
      <Header />

      <div className="px-10 py-10">
        <div className="mx-auto max-w-6xl">

          {/* Page Header */}
          <div className="mb-10">
            <p className="mb-2 text-xs font-medium tracking-[0.25em] text-blue-400">
              TRACE-X AI / ABOUT SYSTEM
            </p>

            <h1 className="text-4xl font-semibold">
              About <span className="text-blue-400">TRACE-X AI</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              An AI-driven component screening and anomaly detection system
              designed for high-reliability environments.
            </p>
          </div>

          {/* What is TRACE-X AI */}
          <div className="rounded-2xl border border-blue-400/15 bg-slate-900/70 p-7 backdrop-blur-xl">

            <h2 className="text-xl font-semibold">
              What is TRACE-X AI?
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-400">
              TRACE-X AI is an intelligent screening platform that analyzes
              time-series parametric data collected during component Burn-In
              and Environmental Stress Screening. Instead of relying only on
              fixed datasheet limits, the system identifies subtle deviations
              within a component lot and predicts future degradation before a
              component reaches a critical condition.
            </p>

          </div>

          {/* Core Modules */}
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* Module A */}
            <div className="rounded-2xl border border-blue-400/15 bg-slate-900/70 p-7 backdrop-blur-xl">

              <span className="text-xs font-medium tracking-wider text-blue-400">
                MODULE A
              </span>

              <h2 className="mt-3 text-xl font-semibold">
                Dynamic Anomaly Detection
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Detects components that behave differently from their
                corresponding lot. This helps identify latent defects that
                may remain hidden when only static datasheet thresholds are
                considered.
              </p>

            </div>

            {/* Module B */}
            <div className="rounded-2xl border border-purple-400/15 bg-slate-900/70 p-7 backdrop-blur-xl">

              <span className="text-xs font-medium tracking-wider text-purple-400">
                MODULE B
              </span>

              <h2 className="mt-3 text-xl font-semibold">
                Predictive Drift Analysis
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Uses early-stage measurements to estimate future component
                behavior and identify potentially unsafe degradation before
                the final screening stage.
              </p>

            </div>

          </div>

          {/* Risk + Explainability */}
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* Risk Classification */}
            <div className="rounded-2xl border border-amber-400/15 bg-slate-900/70 p-7 backdrop-blur-xl">

              <span className="text-xs font-medium tracking-wider text-amber-400">
                DECISION ENGINE
              </span>

              <h2 className="mt-3 text-xl font-semibold">
                Risk Classification
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Combines anomaly score, predicted drift and safety margins to
                classify components into three actionable categories.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">

                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-xs text-emerald-400">
                  NORMAL
                </span>

                <span className="rounded-full border border-yellow-400/20 bg-yellow-400/5 px-3 py-1 text-xs text-yellow-400">
                  SUSPICIOUS
                </span>

                <span className="rounded-full border border-red-400/20 bg-red-400/5 px-3 py-1 text-xs text-red-400">
                  HIGH RISK
                </span>

              </div>

            </div>

            {/* Explainable AI */}
            <div className="rounded-2xl border border-cyan-400/15 bg-slate-900/70 p-7 backdrop-blur-xl">

              <span className="text-xs font-medium tracking-wider text-cyan-400">
                XAI
              </span>

              <h2 className="mt-3 text-xl font-semibold">
                Explainable AI
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Provides interpretable reasons behind every flagged component,
                allowing QA inspectors to understand the anomaly, predicted
                degradation and resulting risk level.
              </p>

            </div>

          </div>

          {/* SIH Problem Statement */}
          <div className="mt-6 rounded-2xl border border-blue-400/15 bg-slate-900/70 p-7 backdrop-blur-xl">

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

              <div>

                <span className="text-xs font-medium tracking-[0.2em] text-blue-400">
                  SMART INDIA HACKATHON 2026
                </span>

                <h2 className="mt-3 text-2xl font-semibold">
                  AI-Driven Anomaly Detection in
                  <span className="text-blue-400">
                    {" "}Component Burn-In & Screening
                  </span>
                </h2>

                <p className="mt-3 text-sm text-slate-400">
                  Organization: ISRO • Department of Space
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Theme: Smart Automation • Category: Software
                </p>

              </div>

              <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 px-6 py-5 text-center">

                <p className="text-xs tracking-wider text-slate-500">
                  PROBLEM STATEMENT
                </p>

                <p className="mt-1 text-3xl font-semibold text-blue-400">
                  26170
                </p>

              </div>

            </div>

          </div>

          {/* Our Team */}
          <div className="mt-6 rounded-2xl border border-purple-400/15 bg-slate-900/70 p-7 backdrop-blur-xl">

            <div className="mb-6">

              <span className="text-xs font-medium tracking-[0.2em] text-purple-400">
                OUR TEAM
              </span>

              <h2 className="mt-2 text-2xl font-semibold">
                Team <span className="text-purple-400">TRACE-X AI</span>
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                A collaborative team working on AI-driven component screening
                and predictive anomaly detection.
              </p>

            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

              {teamMembers.map((member, index) => (
                <div
                  key={member.name}
                  className={`rounded-xl border p-5 text-center ${
                    index === 0
                      ? "border-blue-400/25 bg-blue-400/5"
                      : "border-slate-700/50 bg-slate-950/40"
                  }`}
                >

                  <div
                    className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ${
                      index === 0
                        ? "bg-blue-500 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {member.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-slate-200">
                    {member.name}
                  </h3>

                  <p
                    className={`mt-1 text-xs ${
                      index === 0
                        ? "text-blue-400"
                        : "text-slate-500"
                    }`}
                  >
                    {member.role}
                  </p>

                </div>
              ))}

            </div>

          </div>

          {/* Smart Automation */}
          <div className="mt-6 rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-8 text-center backdrop-blur-xl">

            <p className="text-sm font-medium text-slate-200">
              Smart Automation for High-Reliability Screening
            </p>

            <p className="mx-auto mt-2 max-w-2xl text-xs leading-6 text-slate-500">
              TRACE-X AI transforms conventional component screening into a
              predictive, lot-aware and explainable decision-support system.
            </p>

          </div>

        </div>
      </div>

    </div>
  );
}

export default About;