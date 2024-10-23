type Props = Readonly<{
  children: React.ReactNode;
  onHover: (isHovered: boolean) => void;
}>;

export function HoverableText({ children, onHover }: Props) {
  return (
    <span
      onMouseEnter={() => {
        onHover(true);
      }}
      onMouseLeave={() => {
        onHover(false);
      }}
      className="underline decoration-dotted cursor-pointer hover:underline hover:decoration-solid"
    >
      {children}
    </span>
  );
}
