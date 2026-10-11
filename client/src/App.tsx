import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api, type User } from "./api";
import Login from "./pages/Login";
import Assess from "./pages/Assess";
import History from "./pages/History";
import Review from "./pages/Review";
import Admin from "./pages/Admin";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api<User>("/auth/me").then(setUser).catch(() => setUser(null)).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggle.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  if (!ready) return <p className="wrap">Loading…</p>;
  if (!user) return <Login onAuth={(u) => { setUser(u); nav("/"); }} />;

  const staff = user.role !== "patient";
  return (
    <>
      <nav>
        <strong>Early Risk Check</strong>
        <button
          type="button"
          className="nav-toggle"
          ref={menuToggle}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
        <div id="primary-navigation" className={`nav-menu${menuOpen ? " is-open" : ""}`}>
          <Link to="/">New assessment</Link>
          <Link to="/history">My history</Link>
          {staff && <Link to="/review">Review</Link>}
          {user.role === "admin" && <Link to="/admin">Users</Link>}
          <span className="grow" />
          <span>{user.name}</span>
          <button className="ghost" onClick={async () => { await api("/auth/logout", "POST"); setUser(null); }}>Sign out</button>
        </div>
      </nav>
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Assess />} />
          <Route path="/history" element={<History />} />
          <Route path="/review" element={staff ? <Review /> : <Navigate to="/" />} />
          <Route path="/admin" element={user.role === "admin" ? <Admin /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}
