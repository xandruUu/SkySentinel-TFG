import { createRoot } from "react-dom/client";
import "maplibre-gl/dist/maplibre-gl.css";
import "./index.css";
import App from "./app/index.jsx";

createRoot(document.getElementById("root")).render(<App />);
