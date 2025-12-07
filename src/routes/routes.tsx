import { Route, Routes } from "react-router";
import LoginPage from "../pages/Login";
import { MoviesPage } from "../pages/Movies";
import { GamesPage } from "../pages/Games";
import { LegosPage } from "../pages/Legos";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" Component={MoviesPage} />
      <Route path="/movies" Component={MoviesPage} />
      <Route path="/games" Component={GamesPage} />
      <Route path="/legos" Component={LegosPage} />
      <Route path="/login" Component={LoginPage} />
    </Routes>
  );
};

export default AppRoutes;
