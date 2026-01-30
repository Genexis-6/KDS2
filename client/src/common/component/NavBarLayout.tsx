'use client';

import { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { useCurrentUserStore } from "../../utils/hooks/use_current_user";
import HandleLogout from "../viewModel/handle_logout";

export default function NavbarLayout() {
  const { user } = useCurrentUserStore();

  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Check if there is history to go back to
    setCanGoBack(window.history.length > 1);
  }, []);

  const handleBack = () => {
    if (canGoBack) {
      window.history.back();
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-white shadow-sm border-bottom">
        <div className="container-fluid">

          {/* Back Button */}
          {canGoBack && (
            <button
              onClick={handleBack}
              className="btn btn-outline-secondary me-2"
            >
              ← Back
            </button>
          )}

          {/* Reload Button */}
          <button
            onClick={handleReload}
            className="btn btn-outline-secondary me-2"
          >
            ⟳ Reload
          </button>

          {/* Brand */}
          <Link className="navbar-brand fw-bold text-primary" to="/">
            GENE-XX
          </Link>

          {/* Mobile Toggle */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Collapsible Menu */}
          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {/* Add nav items here */}
            </ul>

            <div className="d-flex align-items-center gap-3">
              {user && (
                <span className="text-dark small bg-light px-3 py-1 rounded-pill border">
                  <b>{user.role === "admin" && `Admin: `}</b>
                  {user.fullName}
                </span>
              )}
              <button
                onClick={HandleLogout}
                className="btn btn-outline-danger btn-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </>
  );
}
