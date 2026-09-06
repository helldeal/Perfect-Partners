export const ItemIconButton = ({
  children,
  title,
  type,
  handleClick,
}: {
  children: React.ReactNode;
  title: string;
  type: "primary" | "secondary";
  handleClick: (e: any) => void;
}) => {
  return (
    <button
      className={`rounded-full p-2 flex items-center justify-center shadow-md transition-colors duration-200 cursor-pointer border ${
        type === "primary"
          ? "border-app-primary bg-app-primary text-white hover:brightness-110"
          : "border-app-border bg-app-surface/80 text-app-muted hover:border-app-primary/60 hover:bg-app-primary-soft hover:text-app-primary"
      }`}
      title={title}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};
