import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import LoginPage from "../pages/Login";
import { MoviesPage } from "../pages/Movies";
import { GamesPage } from "../pages/Games";
import { LegosPage } from "../pages/Legos";
import { useAuth } from "../contexts/authContext";

const ProtectedRoutes = () => {
  const { userLoggedIn, userLoading } = useAuth();
  const location = useLocation();

  if (userLoading) return null;

  if (!userLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ redirectTo: location.pathname }}
      />
    );
  }

  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" Component={LoginPage} />
      <Route element={<ProtectedRoutes />}>
        <Route path="/" Component={MoviesPage} />
        <Route path="/movies" Component={MoviesPage} />
        <Route path="/games" Component={GamesPage} />
        <Route path="/legos" Component={LegosPage} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
