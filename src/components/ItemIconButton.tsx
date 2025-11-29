export const ItemIconButton = ({
  children,
  title,
  handleClick,
}: {
  children: React.ReactNode;
  title: string;
  handleClick: () => void;
}) => {
  return (
    <button
      className="rounded-full p-2 flex items-center justify-center shadow-md hover:bg-[rgba(255,255,255,.1)] hover:border-white hover:text-white bg-[rgba(42,42,42,.6)] text-[hsla(0,0%,100%,.5)] border-[hsla(0,0%,100%,.5)] border-2 transition-colors duration-200 cursor-pointer"
      title={title}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};
