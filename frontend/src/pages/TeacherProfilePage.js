import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import {
  assessmentApi,
  observationApi,
  scheduleApi,
  teacherApi,
} from "@/lib/api";
import { LayoutShell } from "@/components/LayoutShell";
import { PeerRecommendations } from "@/components/PeerRecommendations";
import { MonthlySummary } from "@/components/MonthlySummary";
import { TrendIndicator } from "@/components/TrendIndicator";
import { toast } from "sonner";

export function TeacherProfilePage() {
  const { teacherId } = useParams();
  const queryClient = useQueryClient();

  const { data: teacherRes } = useQuery({
    queryKey: ["teacher", teacherId],
    queryFn: () => teacherApi.get(teacherId).then((r) => r.data),
  });

  const { data: dashboardRes } = useQuery({
    queryKey: ["teacher-dashboard", teacherId],
    queryFn: () => assessmentApi.teacherDashboard(teacherId).then((r) => r.data),
  });

  const { data: summaryInsightsRes } = useQuery({
    queryKey: ["teacher-summary-insights", teacherId],
    queryFn: () =>
      assessmentApi.teacherSummaryInsights(teacherId).then((r) => r.data),
  });

  const { data: summaryReflectionRes } = useQuery({
    queryKey: ["teacher-summary-reflection", teacherId],
    queryFn: () =>
      assessmentApi.teacherSummaryReflection(teacherId).then((r) => r.data),
  });

  const { data: observationsRes } = useQuery({
    queryKey: ["teacher-observations", teacherId],
    queryFn: () =>
      observationApi.listForTeacher(teacherId).then((r) => r.data),
  });

  const saveReflectionMutation = useMutation({
    mutationFn: (payload) =>
      assessmentApi.saveTeacherSummaryReflection(teacherId, payload),
    onSuccess: () => {
      toast.success("Reflection saved");
      queryClient.invalidateQueries({
        queryKey: ["teacher-summary-reflection", teacherId],
      });
    },
    onError: () => {
      toast.error("Failed to save reflection");
    },
  });

  const scheduleConferenceMutation = useMutation({
    mutationFn: (payload) => scheduleApi.create(payload),
    onSuccess: () => {
      toast.success("Coaching conference scheduled");
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
    onError: () => {
      toast.error("Failed to schedule conference");
    },
  });

  const [selfReflection, setSelfReflection] = useState("");
  const [actionsTaken, setActionsTaken] = useState("");

  React.useEffect(() => {
    if (summaryReflectionRes) {
      setSelfReflection(summaryReflectionRes.self_reflection || "");
      setActionsTaken(summaryReflectionRes.actions_taken || "");
    }
  }, [summaryReflectionRes]);

  const elementSummary = dashboardRes?.element_summary ?? [];
  const videos = dashboardRes?.videos ?? [];
  const observations = observationsRes ?? [];

  const observationsByElement = useMemo(() => {
    const map = {};
    observations.forEach((obs) => {
      if (!obs.element_id) return;
      if (!map[obs.element_id]) map[obs.element_id] = [];
      map[obs.element_id].push(obs);
    });
    return map;
  }, [observations]);

  const handleSaveReflection = (e) => {
    e.preventDefault();
    saveReflectionMutation.mutate({
      self_reflection: selfReflection,
      actions_taken: actionsTaken,
    });
  };

  const handleScheduleConference = () => {
    if (!teacherRes) return;
    const start = new Date();
    start.setDate(start.getDate() + 7);
    scheduleConferenceMutation.mutate({
      teacher_id: teacherId,
      course_name: `Coaching conference with ${teacherRes.name}`,
      start_time: start.toISOString(),
    });
  };

  const peerRecommendation =
    summaryInsightsRes?.recommendations?.[0] ||
    "Consider observing a peer with strong questioning techniques for live modeling.";

  return (
    <LayoutShell>
      <div className="mx-auto max-w-6xl px-6 py-6">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-slate-50">
              Growth Insights: {teacherRes?.name || "Teacher"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Growth-oriented insights, human observations, and actionable
              coaching recommendations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleScheduleConference}
              disabled={scheduleConferenceMutation.isPending}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-lg shadow-primary/30 hover:bg-primary/90 disabled:opacity-60"
            >
              Schedule Coaching Conference
            </button>
            <Link
              to="/master-schedule"
              className="text-xs text-slate-300 underline underline-offset-4"
            >
              View master schedule
            </Link>
          </div>
        </header>

        {/* Monthly Performance Summary */}
        <section className="mb-6">
          <MonthlySummary teacherId={teacherId} period="month" />
        </section>

        {/* Summary AI Insight + self-reflection */}
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-7 rounded-xl border border-slate-800 bg-slate-950/70 p-5">
            <h2 className="mb-2 text-sm font-semibold text-slate-200">
              Summary AI Insight
            </h2>
            <p className="mb-3 text-xs text-slate-400">
              Aggregated insight across recent lessons to anchor your coaching
              cycle.
            </p>
            {summaryInsightsRes ? (
              <>
                <div className="mb-3 flex items-center gap-3 text-xs">
                  <div className="rounded-lg bg-slate-900 px-3 py-2">
                    <div className="text-[11px] text-slate-400">
                      Overall trend score
                    </div>
                    <div className="text-sm font-semibold text-slate-50">
                      {summaryInsightsRes.overall_trend_score != null
                        ? `${summaryInsightsRes.overall_trend_score.toFixed(
                            1
                          )}/10`
                        : "No data yet"}
                    </div>
                  </div>
                  <div className="flex-1 text-slate-300">
                    {summaryInsightsRes.summary}
                  </div>
                </div>
                {summaryInsightsRes.recommendations?.length ? (
                  <ul className="list-disc space-y-1 pl-5 text-xs text-slate-300">
                    {summaryInsightsRes.recommendations
                      .slice(0, 3)
                      .map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <div className="text-xs text-slate-500">
                No summary data yet for this teacher.
              </div>
            )}
          </div>

          <div className="md:col-span-5 rounded-xl border border-slate-800 bg-slate-950/70 p-5">
            <h2 className="mb-2 text-sm font-semibold text-slate-200">
              Teacher self-reflection
            </h2>
            <form onSubmit={handleSaveReflection} className="space-y-2 text-xs">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">
                  Self-reflection
                </label>
                <textarea
                  rows={3}
                  value={selfReflection}
                  onChange={(e) => setSelfReflection(e.target.value)}
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-primary/40 focus:ring"
                  placeholder="How do you interpret these insights? What patterns are you noticing across lessons?"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">
                  Actions taken
                </label>
                <textarea
                  rows={2}
                  value={actionsTaken}
                  onChange={(e) => setActionsTaken(e.target.value)}
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-primary/40 focus:ring"
                  placeholder="Document concrete moves you are planning or have tried in upcoming lessons."
                />
              </div>
              <button
                type="submit"
                disabled={saveReflectionMutation.isPending}
                className="mt-1 inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-white hover:bg-primary/90 disabled:opacity-60"
              >
                Save reflection
              </button>
            </form>
          </div>
        </section>

        {/* Growth insights and peer recommendation */}
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-7 rounded-xl border border-slate-800 bg-slate-950/70 p-5">
            <h2 className="mb-2 text-sm font-semibold text-slate-200">
              GrowthInsights
            </h2>
            <p className="mb-3 text-xs text-slate-400">
              Focus on specific, actionable moves the teacher can implement in
              the next 1-2 lessons.
            </p>
            {dashboardRes?.assessments?.length ? (
              <ul className="space-y-2 text-xs text-slate-300">
                {dashboardRes.assessments.slice(0, 3).map((a) => (
                  <li
                    key={a.id}
                    className="rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2"
                  >
                    <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{a.analyzed_at}</span>
                      <span>
                        Overall {a.overall_score.toFixed(1)}/10 •{" "}
                        {a.framework_type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-200">
                      {a.summary}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-slate-500">
                No assessments yet for this teacher.
              </div>
            )}
          </div>

          <div className="md:col-span-5">
            <PeerRecommendations teacherId={teacherId} />
          </div>
        </section>

        {/* Human observations with implementation tracking */}
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-7 rounded-xl border border-slate-800 bg-slate-950/70 p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-200">
              Human observations
            </h2>
            {observations.length === 0 ? (
              <div className="text-xs text-slate-500">
                No observations recorded yet.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {observations.map((obs) => (
                  <div
                    key={obs.id}
                    className="rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2"
                  >
                    <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{obs.created_at}</span>
                      {obs.implementation_status && (
                        <span
                          className={
                            obs.implementation_status === "implemented"
                              ? "rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300"
                              : "rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-300"
                          }
                        >
                          {obs.implementation_status}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-200">
                      {obs.admin_comment || "No admin comment"}
                    </div>
                    {obs.teacher_response && (
                      <div className="mt-1 text-[11px] text-slate-300">
                        <span className="font-semibold text-slate-200">
                          Teacher response:
                        </span>{" "}
                        {obs.teacher_response}
                      </div>
                    )}
                    {obs.video_id && (
                      <div className="mt-1 text-[11px]">
                        <Link
                          to={`/videos/${obs.video_id}`}
                          className="text-primary hover:underline"
                        >
                          View linked clip
                        </Link>
                        {typeof obs.timestamp_seconds === "number" && (
                          <span className="ml-1 text-slate-400">
                            ({Math.round(obs.timestamp_seconds)}s)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Domain scores with hover evidence */}
          <div className="md:col-span-5 rounded-xl border border-slate-800 bg-slate-950/70 p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-200">
              Domain scores & evidence
            </h2>
            <div className="space-y-2 text-xs">
              {elementSummary.map((es) => {
                const obsForElement = observationsByElement[es.element_id] || [];
                return (
                  <div
                    key={es.element_id}
                    className="group rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-slate-100">
                          {es.element_name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {es.assessment_count} assessments
                        </div>
                      </div>
                      <div className="relative">
                        <span
                          className="inline-flex h-6 w-16 items-center justify-center rounded-full text-[11px] font-semibold text-slate-50"
                          style={{
                            backgroundImage:
                              "linear-gradient(to right, #ef4444, #f97316, #22c55e)",
                            opacity: 0.85,
                          }}
                          title={`${es.average_score.toFixed(1)}/10`}
                        >
                          {es.average_score.toFixed(1)}/10
                        </span>
                        {obsForElement.length > 0 && (
                          <div className="pointer-events-none absolute right-0 top-7 z-20 hidden w-72 rounded-md border border-slate-800 bg-slate-950/95 p-3 text-[11px] text-slate-200 shadow-lg group-hover:block">
                            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Evidence
                            </div>
                            <ul className="space-y-1">
                              {obsForElement.slice(0, 3).map((obs) => (
                                <li key={obs.id}>
                                  <div className="text-slate-300">
                                    {obs.admin_comment || "Observation"}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {obs.created_at}
                                    {obs.video_id && (
                                      <>
                                        {" "}
                                        •{" "}
                                        <Link
                                          to={`/videos/${obs.video_id}`}
                                          className="text-primary hover:underline"
                                        >
                                          Open clip
                                        </Link>
                                      </>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                            {obsForElement.length > 3 && (
                              <div className="mt-1 text-[10px] text-slate-500">
                                +{obsForElement.length - 3} more observations
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {videos.length > 0 && (
              <div className="mt-4 text-[11px] text-slate-400">
                Linked videos:{" "}
                {videos.slice(0, 3).map((v) => (
                  <Link
                    key={v.id}
                    to={`/videos/${v.id}`}
                    className="mr-2 text-primary hover:underline"
                  >
                    {v.filename}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </LayoutShell>
  );
}

