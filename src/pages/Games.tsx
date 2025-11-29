import { Header } from "../components/Header";

export const GamesPage = () => {
  return (
    <div className="min-h-screen flex flex-col gap-6 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100">
      <Header navSelected="games" />
      <div className="flex items-center justify-center flex-1 ">
        <span className="text-2xl">🚧 Work in Progress 🚧</span>
      </div>
    </div>
  );
};
