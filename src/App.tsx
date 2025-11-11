import { BrowserRouter } from "react-router";
import AppRoutes from "./routes/routes";
import { AuthProvider } from "./contexts/authContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
