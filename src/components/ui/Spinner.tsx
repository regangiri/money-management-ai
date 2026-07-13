type SpinnerProps = {
  className?: string;
};

// Inline loading spinner. Uses currentColor so it inherits the button/text
// colour, and animate-spin for the motion.
export function Spinner({ className = 'size-4' }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// Convenience wrapper for button contents: spinner + label on one line.
export function ButtonSpinner({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Spinner className="size-4" />
      {label}
    </span>
  );
}
