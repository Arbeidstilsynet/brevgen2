import { clsx } from "clsx/lite";

interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

export function TabButton({
  children,
  className,
  disabled,
  isActive,
  ...rest
}: Readonly<TabButtonProps>) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        "mr-2 p-2 rounded-sm font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500",
        isActive && !disabled && "bg-blue-500 text-white shadow-lg",
        !isActive && !disabled && "bg-gray-300 text-gray-800 hover:bg-gray-400",
        disabled && "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60 shadow-none",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

const iconButtonVariantClasses = {
  blue: "bg-blue-200 border-blue-300 hover:bg-blue-300",
  green: "bg-green-200 border-green-300 hover:bg-green-300",
  indigo: "bg-indigo-200 border-indigo-300 hover:bg-indigo-300",
};

interface IconButtonsProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: keyof typeof iconButtonVariantClasses;
  textClassName?: string;
}

export function IconButton({
  children,
  className,
  variant,
  textClassName,
  disabled,
  ...rest
}: Readonly<IconButtonsProps>) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        "p-1 flex items-center justify-center h-8 w-8 rounded-lg border transition duration-200",
        iconButtonVariantClasses[variant],
        !disabled && "hover:shadow-lg",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none shadow-none",
        className,
      )}
      {...rest}
    >
      <span className={clsx("text-2xl", textClassName)}>{children}</span>
    </button>
  );
}

const actionButtonVariantClasses = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-700",
  secondary: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700",
  danger: "bg-red-600 text-white hover:bg-red-700 border-red-700",
  neutral: "bg-gray-600 text-white hover:bg-gray-700 border-gray-700",
};

const actionButtonSizeClasses = {
  sm: "py-1 px-3 text-sm",
  md: "py-2 px-4",
  lg: "py-3 px-6 text-lg",
};

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof actionButtonVariantClasses;
  size?: "sm" | "md" | "lg";
}

export function ActionButton({
  children,
  className,
  variant = "primary",
  size = "md",
  ...rest
}: Readonly<ActionButtonProps>) {
  return (
    <button
      className={`rounded-sm font-medium border transition duration-200 shadow-sm hover:shadow-lg ${actionButtonVariantClasses[variant]} ${actionButtonSizeClasses[size]} ${className ?? ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}
