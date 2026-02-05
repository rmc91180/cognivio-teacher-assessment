import React from "react";
import { Link } from "react-router-dom";

/**
 * ScoreCell - A score display cell with hover tooltip showing evidence
 * @param {number} score - Score value (0-10)
 * @param {string} elementId - Element identifier for display
 * @param {string} evidence - Evidence text excerpt
 * @param {string} videoId - Optional video ID for linking
 * @param {number} timestamp - Optional video timestamp in seconds
 * @param {number} confidence - Optional AI confidence (0-1)
 * @param {object} previousScore - Optional previous score for trend
 */
export function ScoreCell({
  score,
  elementId,
  evidence,
  videoId,
  timestamp,
  confidence,
  previousScore,
}) {
  if (score == null) {
    return (
      <span
        title={`${elementId}: no data`}
        className="h-3 w-3 rounded-full bg-slate-800"
      />
    );
  }

  const intensity = Math.min(1, Math.max(0, score / 10));
  const isRed = intensity < 0.5;
  const color = isRed
    ? `rgba(248, 113, 113, ${0.4 + intensity * 0.6})`
    : `rgba(34, 197, 94, ${0.4 + intensity * 0.6})`;

  const hasTooltipContent = evidence || videoId || confidence != null;

  return (
    <span className="group relative">
      <span
        title={hasTooltipContent ? undefined : `${elementId}: ${score.toFixed(1)}/10`}
        className="inline-block h-3 w-3 cursor-pointer rounded-sm transition-transform hover:scale-125"
        style={{ backgroundColor: color }}
      />
      {hasTooltipContent && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-64 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900/95 p-3 text-xs shadow-xl group-hover:pointer-events-auto group-hover:block">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-semibold text-slate-100">
              {elementId.toUpperCase()}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {score.toFixed(1)}/10
            </span>
          </div>

          {previousScore != null && (
            <div className="mb-1.5 text-[11px] text-slate-400">
              Previous: {previousScore.toFixed(1)}/10
              {score > previousScore && (
                <span className="ml-1 text-emerald-400">
                  (+{(score - previousScore).toFixed(1)})
                </span>
              )}
              {score < previousScore && (
                <span className="ml-1 text-red-400">
                  ({(score - previousScore).toFixed(1)})
                </span>
              )}
            </div>
          )}

          {evidence && (
            <div className="mb-2 text-slate-300">
              <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Evidence
              </div>
              <p className="line-clamp-3">{evidence}</p>
            </div>
          )}

          {confidence != null && (
            <div className="mb-2 text-[11px]">
              <span className="text-slate-500">AI confidence:</span>{" "}
              <span
                className={
                  confidence >= 0.8
                    ? "text-emerald-400"
                    : confidence >= 0.5
                    ? "text-amber-400"
                    : "text-red-400"
                }
              >
                {(confidence * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {videoId && (
            <div className="border-t border-slate-700 pt-2">
              <Link
                to={
                  timestamp != null
                    ? `/videos/${videoId}?t=${timestamp}`
                    : `/videos/${videoId}`
                }
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                View in video
                {timestamp != null && (
                  <span className="text-slate-400">
                    ({Math.floor(timestamp / 60)}:{String(timestamp % 60).padStart(2, "0")})
                  </span>
                )}
              </Link>
            </div>
          )}

          {/* Tooltip arrow */}
          <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-700 bg-slate-900" />
        </div>
      )}
    </span>
  );
}

export default ScoreCell;
