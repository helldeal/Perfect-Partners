type NotificationPingProps = {
  className?: string;
  size?: "small" | "medium";
  label?: string;
};

export const NotificationPing = ({
  className = "",
  size = "small",
  label,
}: NotificationPingProps) => {
  const sizeClass = size === "medium" ? "h-3 w-3" : "h-2 w-2";

  return (
    <span
      className={`flex shrink-0 ${sizeClass} ${className}`}
      aria-label={label}
    >
      <span className="relative flex h-full w-full">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-app-primary opacity-70" />
        <span className="relative inline-flex h-full w-full rounded-full bg-app-primary shadow-md shadow-app-primary/50" />
      </span>
    </span>
  );
};
