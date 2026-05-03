import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, currentUser } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkClassName = ({ isActive }) =>
    [
      "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    ].join(" ");

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-950"
        >
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-950 text-sm text-white shadow-lg shadow-slate-950/20">
            P
          </span>
          <span>ProofSkill</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {isAuthenticated && (
            <>
              <NavLink to="/projects" className={navLinkClassName}>
                Projects
              </NavLink>
              <NavLink to="/profile" className={navLinkClassName}>
                Profile
              </NavLink>
              {currentUser && currentUser.role === "admin" && (
                <NavLink to="/admin/reviews" className={navLinkClassName}>
                  Admin Reviews
                </NavLink>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              >
                Logout
              </button>
            </>
          )}

          {!isAuthenticated && (
            <NavLink to="/login" className={navLinkClassName}>
              Login
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
