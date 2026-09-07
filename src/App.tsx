import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/routes";
import { AuthProvider } from "./contexts/authContext";
import { NotificationsProvider } from "./contexts/notificationsContext";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <NotificationsProvider>
          <AppRoutes />
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
