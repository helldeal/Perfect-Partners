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
          ? "hover:bg-[rgba(213,213,213,.6)] hover:border-[hsla(0,0%,0%,.5)] hover:text-[hsla(0,0%,0%,.5)] bg-white text-black border-black border-0"
          : "hover:bg-[rgba(255,255,255,.1)] hover:border-white hover:text-white bg-[rgba(42,42,42,.6)] text-[hsla(0,0%,100%,.5)] border-[hsla(0,0%,100%,.5)]"
      }`}
      title={title}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};
