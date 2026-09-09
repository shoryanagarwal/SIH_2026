import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/dashboard.jsx";
import About from "./pages/about.jsx";
import Features from "./pages/features.jsx";


function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Dashboard />} />

        <Route path="/about" element={<About />} />

        <Route path="/features" element={<Features />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;