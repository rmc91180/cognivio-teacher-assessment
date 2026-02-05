import React, { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { assessmentApi } from "@/lib/api";
import { LayoutShell } from "@/components/LayoutShell";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendIndicator } from "@/components/TrendIndicator";

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["roster"],
    queryFn: () => assessmentApi.roster().then((res) => res.data),
  });

  const roster = data?.roster ?? [];
  const selectedElements = data?.selected_elements ?? [];

  // State for customizable focus areas
  const [customFocusAreas, setCustomFocusAreas] = useState(() => {
    const saved = localStorage.getItem("dashboardFocusAreas");
    return saved ? JSON.parse(saved) : null;
  });
  const [showFocusSelector, setShowFocusSelector] = useState(false);

  // Use custom focus areas if set, otherwise default to first 3
  const focusElementIds = customFocusAreas || selectedElements.slice(0, 3);

  // Save focus areas to localStorage when changed
  useEffect(() => {
    if (customFocusAreas) {
      localStorage.setItem("dashboardFocusAreas", JSON.stringify(customFocusAreas));
    }
  }, [customFocusAreas]);

  const toggleFocusArea = (elementId) => {
    setCustomFocusAreas((prev) => {
      const current = prev || selectedElements.slice(0, 3);
      if (current.includes(elementId)) {
        return current.filter((id) => id !== elementId);
      }
      if (current.length >= 5) {
        // Max 5 focus areas
        return current;
      }
      return [...current, elementId];
    });
  };

  const resetFocusAreas = () => {
    setCustomFocusAreas(null);
    localStorage.removeItem("dashboardFocusAreas");
  };

  const focusAreaData = useMemo(() => {
    if (!roster.length || !focusElementIds.length) return [];
    return focusElementIds.map((id) => {
      const label = id.toUpperCase();
      const scores = roster
        .map((t) => t.element_scores?.[id]?.score)
        .filter((s) => typeof s === "number");
      const avg = scores.length
        ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        : null;
      return {
        elementId: id,
        label,
        averageScore: avg,
      };
    });
  }, [roster, focusElementIds]);

  const departmentData = useMemo(() => {
    if (!roster.length) return [];
    const buckets = {};
    roster.forEach((t) => {
      const dept = t.department || "Unassigned";
      const bucket = buckets[dept] || { department: dept, total: 0, count: 0 };
      if (typeof t.overall_score === "number") {
        bucket.total += t.overall_score;
        bucket.count += 1;
      }
      buckets[dept] = bucket;
    });
    return Object.values(buckets).map((b) => ({
      department: b.department,
      averageScore:
        b.count > 0 ? Number((b.total / b.count).toFixed(2)) : null,
    }));
  }, [roster]);

  return (
    <LayoutShell>
      <div className="mx-auto max-w-6xl px-6 py-6">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-slate-50">
              Teacher Performance Overview
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Macro-level view of growth across priority focus areas and
              departments.
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFocusSelector(!showFocusSelector)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              Customize Focus Areas
            </button>
            {showFocusSelector && (
              <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-200">
                    Select Focus Areas (max 5)
                  </h3>
                  <button
                    type="button"
                    onClick={resetFocusAreas}
                    className="text-[10px] text-slate-400 hover:text-slate-200"
                  >
                    Reset to default
                  </button>
                </div>
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {selectedElements.map((elementId) => {
                    const isSelected = focusElementIds.includes(elementId);
                    return (
                      <label
                        key={elementId}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-slate-800"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleFocusArea(elementId)}
                          className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary/40"
                        />
                        <span
                          className={
                            isSelected ? "text-slate-100" : "text-slate-400"
                          }
                        >
                          {elementId.toUpperCase()}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowFocusSelector(false)}
                    className="rounded bg-primary px-3 py-1 text-[11px] font-medium text-white hover:bg-primary/90"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {isLoading ? (
          <div className="mt-8 text-sm text-slate-400">Loading roster...</div>
        ) : roster.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
            No teachers found yet. Start by adding teachers and uploading
            classroom videos.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <section className="md:col-span-7 rounded-xl border border-slate-800 bg-slate-950/70 p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-200">
                School focus areas
              </h2>
              <p className="mb-4 text-xs text-slate-400">
                Aggregate performance on your top three priority rubric
                elements.
              </p>
              {focusAreaData.length === 0 ? (
                <div className="text-xs text-slate-500">
                  No focus area data yet.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={focusAreaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" domain={[0, 10]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020617",
                          borderColor: "#1e293b",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="averageScore" fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="md:col-span-5 rounded-xl border border-slate-800 bg-slate-950/70 p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-200">
                Departmental progress
              </h2>
              <p className="mb-4 text-xs text-slate-400">
                Compare average performance across departments to identify
                pockets of strength and support needs.
              </p>
              {departmentData.length === 0 ? (
                <div className="text-xs text-slate-500">
                  No departmental data yet.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" stroke="#94a3b8" domain={[0, 10]} />
                      <YAxis
                        dataKey="department"
                        type="category"
                        stroke="#94a3b8"
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020617",
                          borderColor: "#1e293b",
                          fontSize: 12,
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="averageScore"
                        name="Avg score"
                        fill="#22c55e"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </LayoutShell>
  );
}

