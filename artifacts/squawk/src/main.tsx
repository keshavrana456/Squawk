import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress errors from browser extensions (MetaMask, wallets, etc.)
// These are injected by browser extensions and are not app errors.
window.addEventListener("unhandledrejection", (e) => {
  const msg = String(e.reason?.message ?? e.reason ?? "");
  const stack = String(e.reason?.stack ?? "");
  if (
    stack.includes("chrome-extension://") ||
    stack.includes("moz-extension://") ||
    msg.includes("MetaMask") ||
    msg.includes("ethereum") ||
    msg.includes("Web3")
  ) {
    e.preventDefault();
  }
});

window.addEventListener("error", (e) => {
  const src = (e.filename ?? "");
  if (src.includes("chrome-extension://") || src.includes("moz-extension://")) {
    e.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
