import React, { useEffect, useRef } from "react";

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

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;

    const path = event.nativeEvent.composedPath();
    if (path.some((el) => el instanceof HTMLElement && el.dataset.ignoreOutside)) {
      return;
    }

    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    // The backdrop is not an interactive element — keyboard dismissal is handled
    // by the document-level Escape listener above. Using onMouseDown instead of
    // onClick avoids a11y lint rules that don't apply to modal backdrops.
    // oxlint-disable-next-line jsx_a11y/no-static-element-interactions
    <div // NOSONAR
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={handleBackdropClick}
    >
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
