export function Spinner() {
  return (
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
  );
}

export function SpinnerOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-50">
      <Spinner />
    </div>
  );
}
