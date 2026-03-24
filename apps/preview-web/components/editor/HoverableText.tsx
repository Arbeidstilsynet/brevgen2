type Props = Readonly<{
  children: React.ReactNode;
  onHover: (isHovered: boolean) => void;
}>;

export function HoverableText({ children, onHover }: Props) {
  return (
    <button
      type="button"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      className="inline underline decoration-dotted cursor-help hover:decoration-solid focus:outline-none focus:decoration-solid bg-transparent border-none p-0 font-inherit text-inherit"
    >
      {children}
    </button>
  );
}
