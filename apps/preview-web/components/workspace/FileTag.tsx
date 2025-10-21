interface FileTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  tag: string;
}

export function FileTag({ tag, ...rest }: FileTagProps) {
  return (
    <span
      className="ml-2 inline-flex items-center rounded-full bg-blue-100 border border-blue-200 px-2 py-0 text-xs text-blue-800 shadow-sm"
      {...rest}
    >
      {tag}
    </span>
  );
}
