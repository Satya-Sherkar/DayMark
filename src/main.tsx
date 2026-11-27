import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import App from "./App";
import { QuickAddOverlay } from "./components/quick-add/QuickAddOverlay";
import "./index.css";

const isQuickAddWindow = (): boolean => {
  if (typeof window === "undefined") return false;
  if (window.location.hash.includes("quick-add") || window.location.search.includes("window=quick-add")) {
    return true;
  }
  try {
    const current = getCurrentWebviewWindow();
    return current?.label === "quick-add";
  } catch {
    return false;
  }
};

const isQuickAdd = isQuickAddWindow();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isQuickAdd ? <QuickAddOverlay /> : <App />}
  </React.StrictMode>,
);
