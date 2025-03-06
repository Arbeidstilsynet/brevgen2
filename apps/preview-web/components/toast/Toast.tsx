const variants = {
  info: {
    background: "bg-blue-50",
    border: "border-blue-500",
    text: "text-gray-900",
    closeButton: "text-blue-700 hover:text-blue-900",
  },
  success: {
    background: "bg-green-50",
    border: "border-green-500",
    text: "text-gray-900",
    closeButton: "text-green-700 hover:text-green-900",
  },
  warning: {
    background: "bg-yellow-100",
    border: "border-yellow-500",
    text: "text-gray-900",
    closeButton: "text-yellow-700 hover:text-yellow-900",
  },
  error: {
    background: "bg-red-50",
    border: "border-red-500",
    text: "text-gray-900",
    closeButton: "text-red-700 hover:text-red-900",
  },
};

type Props = Readonly<{
  message: string;
  variant: "info" | "success" | "warning" | "error";
  onClose: () => void;
}>;

export function Toast({ message, variant, onClose }: Props) {
  const styles = variants[variant];

  return (
    <div
      data-ignore-outside
      className={`z-50 absolute top-0 left-1/2 transform -translate-x-1/2 mt-4
        ${styles.background} ${styles.text} px-4 py-3 rounded-md
        border border-opacity-20 ${styles.border} border-l-4
        flex items-center justify-between min-w-[200px] max-w-[90%] shadow-md`}
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className={`ml-3 ${styles.closeButton} transition-colors duration-200`}
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
