import Header from "../components/Header.jsx";

function Features() {
  const features = [
    {
      number: "01",
      title: "Dynamic Anomaly Detection",
      description:
        "Detects components that behave abnormally compared with other components in the same lot, even when they remain within fixed datasheet limits.",
      tag: "MODULE A",
    },
    {
      number: "02",
      title: "Predictive Drift Analysis",
      description:
        "Uses early-stage measurements to predict future component behavior and identify potentially unsafe degradation before the final screening stage.",
      tag: "MODULE B",
    },
    {
      number: "03",
      title: "Risk Classification",
      description:
        "Combines anomaly score, predicted drift and safety margins to classify components as Normal, Suspicious or High Risk.",
      tag: "DECISION ENGINE",
    },
    {
      number: "04",
      title: "Explainable AI",
      description:
        "Provides interpretable reasons behind every flagged component, helping QA inspectors understand why a component requires attention.",
      tag: "XAI",
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
              TRACE-X AI / CAPABILITIES
            </p>

            <h1 className="text-4xl font-semibold">
              Intelligent Screening
              <span className="text-blue-400"> Features</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              AI-powered capabilities designed to detect subtle component
              anomalies and predict degradation during Burn-In screening.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {features.map((feature) => (
              <div
                key={feature.number}
                className="group rounded-2xl border border-blue-400/15 bg-slate-900/70 p-7 backdrop-blur-xl transition duration-300 hover:border-blue-400/30 hover:bg-slate-900/90"
              >

                <div className="flex items-start justify-between">

                  <span className="text-3xl font-semibold text-blue-400/40">
                    {feature.number}
                  </span>

                  <span className="rounded-full border border-blue-400/15 px-3 py-1 text-[10px] tracking-wider text-blue-300">
                    {feature.tag}
                  </span>

                </div>

                <h2 className="mt-6 text-xl font-semibold">
                  {feature.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {feature.description}
                </p>

                <div className="mt-6 h-px w-12 bg-blue-400/50 transition-all duration-300 group-hover:w-20" />

              </div>
            ))}

          </div>

          {/* Bottom Statement */}
          <div className="mt-6 rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-7 text-center backdrop-blur-xl">

            <p className="text-sm font-medium text-slate-200">
              Built for high-reliability component screening
            </p>

            <p className="mt-2 text-xs text-slate-500">
              From static threshold checking to predictive, lot-aware screening.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Features;