import { Route, Routes } from "react-router";
import LoginPage from "../pages/login";
import { MoviesPage } from "../pages/movies";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/Perfect-Partners/" Component={MoviesPage} />
      <Route path="/Perfect-Partners/login" Component={LoginPage} />
    </Routes>
  );
};

export default AppRoutes;
