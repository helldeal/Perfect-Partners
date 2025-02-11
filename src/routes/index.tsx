import React from "react";
import { Route, Routes } from "react-router";
import MoviePage from "../pages/movie";
import LoginPage from "../pages/login";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/Perfect-Partners/" Component={MoviePage} />
      <Route path="/Perfect-Partners/login" Component={LoginPage} />
    </Routes>
  );
};

export default AppRoutes;
