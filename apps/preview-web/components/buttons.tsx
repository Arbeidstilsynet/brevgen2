interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

export function TabButton({ children, className, isActive, ...rest }: Readonly<TabButtonProps>) {
  return (
    <button
      className={`mr-2 p-2 transition duration-200 ${className ?? ""} ${isActive ? "bg-blue-500 text-white shadow-lg" : "bg-gray-300 text-gray-800 hover:bg-gray-400"}`}
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
  ...rest
}: Readonly<IconButtonsProps>) {
  return (
    <button
      className={`p-1 flex items-center justify-center h-8 w-8 rounded-lg border hover:shadow-lg transition duration-200 ${iconButtonVariantClasses[variant]} ${className ?? ""}`}
      {...rest}
    >
      <span className={`text-2xl ${textClassName ?? ""}`}>{children}</span>
    </button>
  );
}

const actionButtonVariantClasses = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-700",
  secondary: "bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600",
  danger: "bg-red-500 text-white hover:bg-red-600 border-red-600",
  neutral: "bg-gray-500 text-white hover:bg-gray-600 border-gray-600",
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
      className={`rounded font-medium border transition duration-200 shadow hover:shadow-lg ${actionButtonVariantClasses[variant]} ${actionButtonSizeClasses[size]} ${className ?? ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}
