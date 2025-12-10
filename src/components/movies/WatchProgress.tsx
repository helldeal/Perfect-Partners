export const WatchProgress = ({ progress }: { progress: number }) => {
  return (
    <div
      className="absolute bottom-0 w-full"
      style={{ display: "flex", alignItems: "center" }}
    >
      <div
        style={{
          height: "4px",
          width: "100%",
          backgroundColor: "transparent",
          borderRadius: "5px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            backgroundColor: "#3b82f6",
          }}
        ></div>
      </div>
    </div>
  );
};
