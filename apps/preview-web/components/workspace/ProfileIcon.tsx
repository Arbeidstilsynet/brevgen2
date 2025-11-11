interface ProfileIconProps {
  fullName: string | undefined;
  lastModified: Date | undefined;
}

export function ProfileIcon({ fullName, lastModified }: Readonly<ProfileIconProps>) {
  if (!fullName) {
    // Return placeholder with same width to maintain consistent layout
    return <span className="w-8 h-8 ml-2 inline-block" aria-hidden="true" />;
  }

  const getInitials = (name: string): string => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(fullName);

  return (
    <span className="relative group inline-block ml-2" aria-hidden="true">
      <span
        className="w-8 h-8 rounded-full bg-gray-400 text-white inline-flex items-center justify-center text-xs font-medium cursor-default"
        role="img"
        aria-hidden="true"
      >
        {initials}
      </span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
        <span className="bg-gray-800 text-white text-sm rounded px-3 py-2 whitespace-nowrap block shadow-lg">
          <span className="text-gray-300 text-xs block">Last changed by</span>
          <span className="font-medium block">{fullName}</span>
          {lastModified && (
            <span className="text-gray-300 text-xs block">
              {` ${lastModified.toLocaleDateString()} ${lastModified.toLocaleTimeString()}`}
            </span>
          )}
        </span>
      </span>
    </span>
  );
}
