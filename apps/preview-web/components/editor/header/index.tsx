type Props = Readonly<{
  children: React.ReactNode;
}>;

export function EditorHeader({ children }: Props) {
  return <header className="h-[5vh] flex items-center bg-gray-200">{children}</header>;
}
