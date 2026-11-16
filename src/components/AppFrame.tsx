import { Suspense } from "react";
import {
  Activity,
  Compass,
  Home,
  Info,
  Layers2,
  Orbit,
  Search,
  Sparkles,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { staticOnly } from "../lib/deployment";

const navigation = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/compare", label: "Compare", icon: Layers2 },
  { to: "/objects", label: "Objects", icon: Search },
  { to: "/timeline", label: "Timeline", icon: Activity },
  { to: "/about", label: "About", icon: Info },
];

export function AppFrame() {
  return (
    <>
      <a className="skip-link" href="#main-content" onClick={(event) => {
        if (staticOnly) {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }
      }}>Skip to content</a>
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="SPHEREx Explorer home">
          <span className="brand-mark"><Orbit size={25} strokeWidth={1.8} /></span>
          <span>SPHEREx Explorer</span>
        </NavLink>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <NavLink className="outline-pill" to="/explore">
          Explore the sky <span aria-hidden="true">→</span>
        </NavLink>
      </header>

      <main id="main-content" tabIndex={-1}>
        <Suspense fallback={<div className="page-loading" role="status">Loading explorer…</div>}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-tags">
            <span>REAL ARCHIVE DATA</span><span>SCIENTIFIC CONTEXT</span><span>OPEN EXPLORATION</span>
          </div>
          <p>
            SPHEREx data: <a href="https://irsa.ipac.caltech.edu/Missions/spherex.html" target="_blank" rel="noreferrer">NASA/IPAC IRSA</a>
            <span aria-hidden="true"> · </span>
            Catalog resolver: <a href="https://simbad.cds.unistra.fr/" target="_blank" rel="noreferrer">SIMBAD</a>
          </p>
          <p className="footer-note">SPHEREx mission data and NASA/IPAC services are credited to their respective providers. This independent project is not an official NASA website.</p>
          <p className="footer-note">© 2026 Marwan Abdelrahman</p>
        </div>
      </footer>
      <div className="ambient-mark" aria-hidden="true"><Sparkles size={21} /></div>
    </>
  );
}
