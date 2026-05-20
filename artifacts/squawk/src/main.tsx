import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function isExtensionError(e: { reason?: any; filename?: string; message?: string }) {
  const msg = String((e as any).reason?.message ?? (e as any).reason ?? e.message ?? "");
  const stack = String((e as any).reason?.stack ?? "");
  const src = String((e as any).filename ?? "");
  return (
    stack.includes("chrome-extension://") ||
    stack.includes("moz-extension://") ||
    src.includes("chrome-extension://") ||
    src.includes("moz-extension://") ||
    msg.includes("MetaMask") ||
    msg.includes("ethereum") ||
    msg.includes("Web3") ||
    msg.includes("Failed to connect to MetaMask")
  );
}

// Capture phase so we fire BEFORE Vite's error overlay listener
window.addEventListener("unhandledrejection", (e) => {
  if (isExtensionError(e)) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}, true);

window.addEventListener("error", (e) => {
  if (isExtensionError(e)) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}, true);

createRoot(document.getElementById("root")!).render(<App />);
