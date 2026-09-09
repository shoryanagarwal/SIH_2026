import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-slate-700/30 px-10 py-5">

      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-1">
        <span className="text-2xl font-bold tracking-wide text-white">
          TRACE-X
        </span>

        <span className="text-2xl font-bold tracking-wide text-blue-400">
          AI
        </span>
      </NavLink>


      {/* Navigation */}
      <div className="flex items-center gap-8">

        <NavLink
          to="/"
          className={({ isActive }) =>
            `text-sm transition ${
              isActive
                ? "text-blue-400"
                : "text-slate-400 hover:text-white"
            }`
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/about"
          className={({ isActive }) =>
            `text-sm transition ${
              isActive
                ? "text-blue-400"
                : "text-slate-400 hover:text-white"
            }`
          }
        >
          About
        </NavLink>

      </div>


      {/* System Status */}
      <div className="rounded-lg border border-blue-400/20 bg-slate-900/60 px-4 py-2 text-sm text-blue-300 backdrop-blur-md">
        <span className="mr-2">●</span>
        System Online
      </div>

    </nav>
  );
}

export default Navbar;