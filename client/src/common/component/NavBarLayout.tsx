'use client';

import { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { ArrowLeft, RotateCw } from "lucide-react";
import { useCurrentUserStore } from "../../utils/hooks/use_current_user";
import HandleLogout from "../viewModel/handle_logout";
import Brand from "./Brand";

function initialsOf(fullName?: string) {
  return (fullName ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

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
      <nav className="cbx-nav navbar navbar-expand-lg">
        <div className="container-fluid py-1">

          <div className="d-flex align-items-center gap-1">
            {canGoBack && (
              <button
                onClick={handleBack}
                className="btn btn-ghost btn-sm d-flex align-items-center gap-1"
              >
                <ArrowLeft size={15} /> Back
              </button>
            )}

            <button
              onClick={handleReload}
              className="btn btn-ghost btn-sm d-flex align-items-center"
              aria-label="Reload page"
              title="Reload page"
            >
              <RotateCw size={15} />
            </button>
          </div>

          {/* Brand */}
          <Link className="navbar-brand" to="/" aria-label="CBX home">
            <Brand />
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

            <div className="d-flex align-items-center gap-2">
              {user && (
                <span className="user-chip">
                  <span className="user-chip-avatar" aria-hidden="true">{initialsOf(user.fullName)}</span>
                  <span>
                    {user.role === "admin" && <span className="user-chip-role">Admin · </span>}
                    {user.fullName}
                  </span>
                </span>
              )}
              <button onClick={HandleLogout} className="btn btn-ghost-danger btn-sm">
                Log out
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
