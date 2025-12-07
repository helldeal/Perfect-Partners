import { Route, Routes } from "react-router";
import LoginPage from "../pages/Login";
import { MoviesPage } from "../pages/Movies";
import { GamesPage } from "../pages/Games";
import { LegosPage } from "../pages/Legos";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/Perfect-Partners/" Component={MoviesPage} />
      <Route path="/Perfect-Partners/movies" Component={MoviesPage} />
      <Route path="/Perfect-Partners/games" Component={GamesPage} />
      <Route path="/Perfect-Partners/legos" Component={LegosPage} />
      <Route path="/Perfect-Partners/login" Component={LoginPage} />
    </Routes>
  );
};

export default AppRoutes;
