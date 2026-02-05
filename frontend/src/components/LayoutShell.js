import React from "react";
import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, PlayCircle, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function LayoutShell({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50">
      <aside className="w-64 border-r border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold">
              Co
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight">
              Cognivio
            </span>
          </Link>
        </div>
        <nav className="mt-4 space-y-1 px-2 text-sm">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/teachers" icon={Users} label="Teachers" />
          <NavItem to="/videos" icon={PlayCircle} label="Videos & Assessments" />
        </nav>
        <div className="mt-auto border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <div className="truncate">
                <div className="font-medium text-slate-100 truncate">
                  {user.name}
                </div>
                <div className="truncate">{user.email}</div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          ) : (
            <span>Not authenticated</span>
          )}
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
        {children}
      </main>
    </div>
  );
}

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
          isActive
            ? "bg-slate-800 text-slate-50"
            : "text-slate-300 hover:bg-slate-900 hover:text-slate-50",
        ].join(" ")
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

