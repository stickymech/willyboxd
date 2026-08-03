import { Routes, Route } from "react-router-dom";
import { Home } from "./routes/Home";
import { Login } from "./routes/Login";
import { Register } from "./routes/Register";
import { Search } from "./routes/Search";
import { FilmDetail } from "./routes/FilmDetail";
import { Diary } from "./routes/Diary";
import { Watchlist } from "./routes/Watchlist";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/search" element={<Search />} />
      <Route path="/films/:id" element={<FilmDetail />} />
      <Route path="/diary" element={<Diary />} />
      <Route path="/watchlist" element={<Watchlist />} />
    </Routes>
  );
}

export default App;
