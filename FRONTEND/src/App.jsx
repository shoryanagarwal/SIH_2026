import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/dashboard.jsx";
import About from "./pages/about.jsx";
import Features from "./pages/features.jsx";
import History from "./components/history.jsx";
import HistoryDetails from "./components/HistoryDetails.jsx";


function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Dashboard />} />

        <Route path="/about" element={<About />} />

        <Route path="/features" element={<Features />} />

        <Route path="/history" element={<History />} />

        <Route
          path="/history/:id"
          element={<HistoryDetails />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;