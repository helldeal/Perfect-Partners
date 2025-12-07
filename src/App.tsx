import { HashRouter } from "react-router";
import AppRoutes from "./routes/routes";
import { AuthProvider } from "./contexts/authContext";

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
