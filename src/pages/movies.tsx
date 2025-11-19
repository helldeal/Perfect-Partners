import { useState } from "react";
import { getSearchMultiQuery, getTrendingMoviesQuery } from "../api/tmdb";
import { Header } from "../components/Header";

export const MoviesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const trendingMoviesQuery = getTrendingMoviesQuery();
  const searchMultiQuery = getSearchMultiQuery(searchTerm);

  console.log(
    "Media Results:",
    searchTerm.length > 1
      ? searchMultiQuery.data?.results
      : trendingMoviesQuery.data?.results
  );

  return (
    <div className="min-h-screen flex flex-col gap-6 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100 p-8">
      <Header />
      <input
        type="text"
        placeholder="Search for a movie..."
        style={{ padding: "8px", marginTop: "16px" }}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};
