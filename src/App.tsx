import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import LevelSelect from "./pages/LevelSelect";
import Play from "./pages/Play";
import ThemeGallery from "./pages/ThemeGallery";
import { ThemeProvider } from "./components/ThemeProvider";
import { AmbientLayer } from "./components/AmbientLayer";

export default function App() {
  return (
    <ThemeProvider>
      <AmbientLayer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/themes" element={<ThemeGallery />} />
        <Route path="/levels" element={<LevelSelect />} />
        <Route path="/play/:levelId" element={<Play />} />
      </Routes>
    </ThemeProvider>
  );
}
