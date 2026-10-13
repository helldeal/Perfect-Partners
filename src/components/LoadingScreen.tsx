import logo from "../assets/logo.png";

export const LoadingScreen = () => (
  <main
    role="status"
    aria-live="polite"
    aria-busy="true"
    className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center gap-6 bg-app-bg p-6 text-app-text"
  >
    <div className="relative flex h-44 w-44 items-center justify-center sm:h-56 sm:w-56">
      <div aria-hidden="true" className="absolute inset-0 rounded-full border border-app-primary/20" />
      <div aria-hidden="true" className="absolute inset-0 rounded-full border-2 border-transparent border-t-app-primary motion-safe:animate-spin" />
      <img src={logo} alt="Perfect Partners" className="h-32 w-32 object-contain motion-safe:animate-pulse sm:h-40 sm:w-40" />
    </div>
    <p className="text-sm text-app-muted">Chargement de votre bibliothèque…</p>
  </main>
);
