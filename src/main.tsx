import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register the service worker once at boot — enables Web Push and a
// minimal offline shell. Failures are non-fatal.
if ('serviceWorker' in navigator && import.meta.env.PROD !== false) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
