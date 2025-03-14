type Props = Readonly<{
  error: Error | null;
  label: string;
}>;

export function ErrorDetails({ error, label }: Props) {
  if (!error) return null;
  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
      <p className="font-bold">{label}</p>
      <p>{String(error)}</p>
      <details className="mt-2">
        <summary className="cursor-pointer">Technical details</summary>
        <pre className="mt-2 text-sm overflow-auto">{JSON.stringify(error, null, 2)}</pre>
      </details>
    </div>
  );
}
