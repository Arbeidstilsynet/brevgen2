import React, { useCallback, useEffect, useRef } from "react";

type Props = Readonly<{
  children: React.ReactNode;
  /** Width in percentage, default is 80% */
  widthPercent?: number;
  /** Height in percentage, default is 80% */
  heightPercent?: number;
  onClose: () => void;
}>;

export function Overlay({ children, widthPercent = 80, heightPercent = 80, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        const path = event.composedPath();
        // If any element in the path has the data-ignore-outside attribute, do nothing.
        if (path.some((el) => el instanceof HTMLElement && el.dataset.ignoreOutside)) {
          return;
        }

        onClose();
      }
    },
    [onClose],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClickOutside, handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="relative bg-white rounded-lg shadow-lg"
        style={{
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
        }}
      >
        <button
          className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-300"
          onClick={onClose}
          aria-label="Close Overlay"
        >
          🗙
        </button>
        <div className="p-6 overflow-auto h-full">{children}</div>
      </div>
    </div>
  );
}
