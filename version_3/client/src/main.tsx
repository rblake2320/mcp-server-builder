import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Apply custom fonts
document.documentElement.style.fontFamily = "'Roboto', sans-serif";
document.documentElement.classList.add('font-sans');

// Create and render the app
createRoot(document.getElementById("root")!).render(<App />);
