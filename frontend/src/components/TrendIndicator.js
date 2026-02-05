import React from "react";

/**
 * TrendIndicator - Shows trend direction with arrow and percentage change
 * @param {number} currentScore - Current score value
 * @param {number} previousScore - Previous score value for comparison
 * @param {string} size - Size variant: 'sm' | 'md' | 'lg'
 */
export function TrendIndicator({ currentScore, previousScore, size = "sm" }) {
  if (
    typeof currentScore !== "number" ||
    typeof previousScore !== "number" ||
    previousScore === 0
  ) {
    return (
      <span className="inline-flex items-center text-slate-500">
        <span className="text-xs">—</span>
      </span>
    );
  }

  const change = currentScore - previousScore;
  const percentChange = ((change / previousScore) * 100).toFixed(1);
  const isPositive = change > 0;
  const isNeutral = Math.abs(change) < 0.1;

  const sizeClasses = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  const arrowSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (isNeutral) {
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-slate-400 ${sizeClasses[size]}`}
        title={`No change from ${previousScore.toFixed(1)}`}
      >
        <svg
          className={arrowSizes[size]}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14"
          />
        </svg>
        <span>0%</span>
      </span>
    );
  }

  if (isPositive) {
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-emerald-400 ${sizeClasses[size]}`}
        title={`Up from ${previousScore.toFixed(1)} to ${currentScore.toFixed(1)}`}
      >
        <svg
          className={arrowSizes[size]}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
        <span>+{percentChange}%</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-red-400 ${sizeClasses[size]}`}
      title={`Down from ${previousScore.toFixed(1)} to ${currentScore.toFixed(1)}`}
    >
      <svg
        className={arrowSizes[size]}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
      <span>{percentChange}%</span>
    </span>
  );
}

export default TrendIndicator;
