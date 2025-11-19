import { Route, Routes } from "react-router";
import { MoviesPage } from "../pages/Movies";
import LoginPage from "../pages/Login";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/Perfect-Partners/" Component={MoviesPage} />
      <Route path="/Perfect-Partners/login" Component={LoginPage} />
    </Routes>
  );
};

export default AppRoutes;
