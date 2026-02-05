import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { scheduleApi, teacherApi } from "@/lib/api";
import { LayoutShell } from "@/components/LayoutShell";

export function MasterSchedulePage() {
  const { data: teachersRes } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => teacherApi.list().then((r) => r.data),
  });

  const { data: schedulesRes } = useQuery({
    queryKey: ["schedules"],
    queryFn: () => scheduleApi.list().then((r) => r.data),
  });

  const [showPast, setShowPast] = useState(false);

  const teacherById = useMemo(() => {
    const map = {};
    (teachersRes ?? []).forEach((t) => {
      map[t.id] = t;
    });
    return map;
  }, [teachersRes]);

  const upcoming = useMemo(() => {
    const list = (schedulesRes ?? []).map((s) => ({
      ...s,
      start: new Date(s.start_time),
    }));
    const now = new Date();
    return list
      .filter((s) => (showPast ? true : s.start >= now))
      .sort((a, b) => a.start - b.start);
  }, [schedulesRes, showPast]);

  return (
    <LayoutShell>
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-slate-50">
              Master recording schedule
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Upcoming class recordings across the school with one-click join.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="h-3 w-3 rounded border-slate-700 bg-slate-900 text-primary"
            />
            Show past sessions
          </label>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 text-sm">
          {upcoming.length === 0 ? (
            <div className="text-xs text-slate-500">
              No scheduled recordings yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/80">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Teacher / Course</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Join</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((s) => {
                    const teacher = teacherById[s.teacher_id];
                    const startStr = s.start.toLocaleString();
                    return (
                      <tr
                        key={s.id}
                        className="border-t border-slate-800 hover:bg-slate-900/60"
                      >
                        <td className="px-3 py-2 text-[11px] text-slate-300">
                          {startStr}
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs font-medium text-slate-100">
                            {teacher?.name || "Unknown teacher"}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {s.course_name}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[11px] text-slate-300">
                          {s.location || "—"}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-slate-300">
                          {s.recording_status}
                        </td>
                        <td className="px-3 py-2 text-[11px]">
                          {s.join_url ? (
                            <a
                              href={s.join_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-white hover:bg-primary/90"
                            >
                              Join
                            </a>
                          ) : (
                            <span className="text-slate-500">No link</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </LayoutShell>
  );
}

