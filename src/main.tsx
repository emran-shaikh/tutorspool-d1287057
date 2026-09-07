import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { CurrencyProvider } from "./contexts/CurrencyContext";

// When a page's code file can't be fetched (typically because a new version
// was deployed while the tab was open), refresh once into the new build
// instead of letting the app crash into the error screen.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  try {
    const last = Number(sessionStorage.getItem("chunk-reload-at") || 0);
    if (Date.now() - last > 60_000) {
      sessionStorage.setItem("chunk-reload-at", String(Date.now()));
      window.location.reload();
    }
  } catch {
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  </HelmetProvider>
);
