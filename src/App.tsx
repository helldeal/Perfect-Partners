import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/routes";
import { AuthProvider } from "./contexts/authContext";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
