import React from "react";
import { Route, Routes } from "react-router";
import MoviePage from "../pages/movie";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/Perfect-Partners/" Component={MoviePage} />
    </Routes>
  );
};

export default AppRoutes;
