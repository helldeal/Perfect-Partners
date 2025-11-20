import { Route, Routes } from "react-router";
import LoginPage from "../pages/Login";
import { MoviesPage } from "../pages/Movies";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/Perfect-Partners/" Component={MoviesPage} />
      <Route path="/Perfect-Partners/login" Component={LoginPage} />
    </Routes>
  );
};

export default AppRoutes;
