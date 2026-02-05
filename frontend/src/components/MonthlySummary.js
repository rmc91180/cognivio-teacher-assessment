import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { assessmentApi } from "@/lib/api";
import { TrendIndicator } from "@/components/TrendIndicator";

/**
 * MonthlySummary - Displays aggregated performance summary for a period
 * @param {string} teacherId - The teacher's ID
 * @param {string} period - Period type: 'month' | 'quarter' | 'year'
 */
export function MonthlySummary({ teacherId, period = "month" }) {
  const { data: dashboardRes, isLoading } = useQuery({
    queryKey: ["teacher-dashboard", teacherId],
    queryFn: () =>
      assessmentApi.teacherDashboard(teacherId).then((r) => r.data),
    enabled: !!teacherId,
  });

  const summaryData = useMemo(() => {
    if (!dashboardRes?.assessments?.length) {
      return null;
    }

    const assessments = dashboardRes.assessments;
    const now = new Date();
    let periodStart;

    switch (period) {
      case "quarter":
        periodStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "year":
        periodStart = new Date(now.getFullYear(), 0, 1);
        break;
      case "month":
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Filter assessments for current period
    const currentPeriodAssessments = assessments.filter(
      (a) => new Date(a.analyzed_at) >= periodStart
    );

    // Previous period for comparison
    let prevPeriodStart;
    let prevPeriodEnd;
    switch (period) {
      case "quarter":
        prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        prevPeriodEnd = periodStart;
        break;
      case "year":
        prevPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
        prevPeriodEnd = periodStart;
        break;
      case "month":
      default:
        prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevPeriodEnd = periodStart;
    }

    const previousPeriodAssessments = assessments.filter(
      (a) =>
        new Date(a.analyzed_at) >= prevPeriodStart &&
        new Date(a.analyzed_at) < prevPeriodEnd
    );

    // Calculate averages
    const currentAvg =
      currentPeriodAssessments.length > 0
        ? currentPeriodAssessments.reduce((sum, a) => sum + a.overall_score, 0) /
          currentPeriodAssessments.length
        : null;

    const previousAvg =
      previousPeriodAssessments.length > 0
        ? previousPeriodAssessments.reduce((sum, a) => sum + a.overall_score, 0) /
          previousPeriodAssessments.length
        : null;

    // Find highlights (highest scored elements)
    const elementScores = {};
    currentPeriodAssessments.forEach((a) => {
      a.element_scores?.forEach((es) => {
        if (!elementScores[es.element_id]) {
          elementScores[es.element_id] = {
            name: es.element_name,
            scores: [],
          };
        }
        elementScores[es.element_id].scores.push(es.score);
      });
    });

    const elementAverages = Object.entries(elementScores)
      .map(([id, data]) => ({
        id,
        name: data.name,
        avg: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      }))
      .sort((a, b) => b.avg - a.avg);

    const highlights = elementAverages.slice(0, 3);
    const lowlights = elementAverages.slice(-3).reverse();

    // Generate recommendations based on lowlights
    const recommendations = lowlights
      .filter((e) => e.avg < 6)
      .map((e) => `Focus on improving ${e.name} (currently ${e.avg.toFixed(1)}/10)`);

    return {
      currentAvg,
      previousAvg,
      assessmentCount: currentPeriodAssessments.length,
      previousCount: previousPeriodAssessments.length,
      highlights,
      lowlights,
      recommendations,
      periodLabel: period === "month" ? "This Month" : period === "quarter" ? "This Quarter" : "This Year",
    };
  }, [dashboardRes, period]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-200">
          Performance Summary
        </h2>
        <div className="text-xs text-slate-500">Loading summary...</div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-200">
          Performance Summary
        </h2>
        <div className="text-xs text-slate-500">
          No assessment data available for this period.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">
          Performance Summary
        </h2>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
          {summaryData.periodLabel}
        </span>
      </div>

      {/* Overall score */}
      <div className="mb-4 flex items-center gap-4">
        <div className="rounded-lg bg-slate-900 px-4 py-3">
          <div className="text-[11px] text-slate-400">Overall Score</div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-50">
              {summaryData.currentAvg?.toFixed(1) || "—"}
            </span>
            <span className="text-sm text-slate-400">/10</span>
            <TrendIndicator
              currentScore={summaryData.currentAvg}
              previousScore={summaryData.previousAvg}
              size="md"
            />
          </div>
        </div>
        <div className="text-xs text-slate-400">
          <div>{summaryData.assessmentCount} assessments this period</div>
          {summaryData.previousCount > 0 && (
            <div>vs {summaryData.previousCount} previous period</div>
          )}
        </div>
      </div>

      {/* Highlights */}
      {summaryData.highlights.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
            Highlights
          </div>
          <div className="flex flex-wrap gap-2">
            {summaryData.highlights.map((h) => (
              <span
                key={h.id}
                className="inline-flex items-center rounded bg-emerald-500/20 px-2 py-1 text-[11px] text-emerald-300"
              >
                {h.name || h.id}
                <span className="ml-1.5 font-semibold">{h.avg.toFixed(1)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Areas for growth */}
      {summaryData.lowlights.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-400">
            Areas for Growth
          </div>
          <div className="flex flex-wrap gap-2">
            {summaryData.lowlights.map((l) => (
              <span
                key={l.id}
                className="inline-flex items-center rounded bg-amber-500/20 px-2 py-1 text-[11px] text-amber-300"
              >
                {l.name || l.id}
                <span className="ml-1.5 font-semibold">{l.avg.toFixed(1)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {summaryData.recommendations.length > 0 && (
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Recommendations
          </div>
          <ul className="space-y-1 text-xs text-slate-300">
            {summaryData.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-primary">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MonthlySummary;
