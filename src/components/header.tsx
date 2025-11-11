import { Navigate } from "react-router";
import { useAuth } from "../contexts/authContext";
import { doSignOut } from "../firebase/auth";

export const Header = () => {
  const { userLoggedIn, userLoading, currentUser } = useAuth();
  console.log("Header auth state:", {
    userLoggedIn,
    userLoading,
    currentUser,
  });
  {
    !userLoggedIn && !userLoading && (
      <Navigate to={"/Perfect-Partners/login"} replace={true} />
    );
  }

  const handleSignOut = async () => {
    await doSignOut();
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        borderBottom: "1px solid #eee",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>Perfect Partners</h1>
        <nav style={{ color: "#333", fontSize: 14 }}>
          Vidéogramme <span style={{ opacity: 0.6 }}>/</span> Jeux Vidéo{" "}
          <span style={{ opacity: 0.6 }}>/</span> Lego
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Profile dropdown using native <details> so no extra hooks required */}
        <details style={{ position: "relative" }}>
          <summary
            style={{
              listStyle: "none",
              cursor: "pointer",
              padding: 0,
              margin: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={currentUser?.photoURL || ""}
              alt={currentUser?.displayName || "profile"}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          </summary>

          <div
            style={{
              position: "absolute",
              right: 0,
              top: "110%",
              background: "#000",
              border: "1px solid #e6e6e6",
              borderRadius: 8,
              padding: 8,
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
              minWidth: 160,
              zIndex: 50,
            }}
          >
            <div
              style={{
                padding: "6px 8px",
                borderBottom: "1px solid #f0f0f0",
                fontSize: 14,
              }}
            >
              {currentUser?.displayName}
            </div>
            <button
              onClick={handleSignOut}
              style={{
                marginTop: 8,
                width: "100%",
                padding: "8px 10px",
                background: "#e53e3e",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
              }}
              type="button"
            >
              Sign out
            </button>
          </div>
        </details>
      </div>
    </header>
  );
};
