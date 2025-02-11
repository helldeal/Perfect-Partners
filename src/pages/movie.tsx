import React from "react";
import { useAuth } from "../contexts/authContext";
import { Navigate } from "react-router";

const MoviePage: React.FC = () => {
  const { userLoggedIn, userLoading, currentUser } = useAuth();
  return (
    <div>
      {!userLoading && !userLoggedIn && (
        <Navigate to={"/Perfect-Partners/login"} replace={true} />
      )}
      {currentUser && (
        <>
          <h1>Trop fort</h1>
          <p>{currentUser?.displayName}</p>
        </>
      )}
    </div>
  );
};

export default MoviePage;
