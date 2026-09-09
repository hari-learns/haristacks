"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark";

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setMode(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Mode = mode === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("haristacks-theme", next);
    } catch {
      // private mode — the choice just will not persist, which is fine
    }
    setMode(next);
  }

  const dark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light" : "Switch to dark"}
      aria-pressed={dark}
      className="grid h-11 w-11 place-items-center rounded-full text-muted transition-colors duration-200 hover:text-ink"
    >
      {/* explicit geometry: an SVG cannot collapse inside a button on iOS */}
      <svg viewBox="0 0 12 12" width="18" height="18" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
        {mode === null ? null : dark ? (
          // crescent
          <>
            <rect x="4" y="2" width="3" height="1" />
            <rect x="3" y="3" width="3" height="1" />
            <rect x="2" y="4" width="3" height="1" />
            <rect x="2" y="5" width="3" height="1" />
            <rect x="2" y="6" width="3" height="1" />
            <rect x="2" y="7" width="3" height="1" />
            <rect x="3" y="8" width="3" height="1" />
            <rect x="4" y="9" width="3" height="1" />
          </>
        ) : (
          // sun
          <>
            <rect x="4" y="4" width="4" height="4" />
            <rect x="5" y="3" width="2" height="1" />
            <rect x="5" y="8" width="2" height="1" />
            <rect x="3" y="5" width="1" height="2" />
            <rect x="8" y="5" width="1" height="2" />
            <rect x="5" y="0" width="2" height="1" />
            <rect x="5" y="11" width="2" height="1" />
            <rect x="0" y="5" width="1" height="2" />
            <rect x="11" y="5" width="1" height="2" />
            <rect x="1" y="1" width="1" height="1" />
            <rect x="10" y="10" width="1" height="1" />
            <rect x="10" y="1" width="1" height="1" />
            <rect x="1" y="10" width="1" height="1" />
          </>
        )}
      </svg>
    </button>
  );
}
