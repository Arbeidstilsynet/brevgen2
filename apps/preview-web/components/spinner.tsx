export function Spinner() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="w-10 h-10 flex items-center justify-center flex-shrink-0"
    >
      <span className="h-6 w-6 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
    </div>
  );
}

export function SpinnerOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-50">
      <Spinner />
    </div>
  );
}
