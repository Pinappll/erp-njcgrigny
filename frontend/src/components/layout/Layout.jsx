import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const titles = {
  "/": "Dashboard",
  "/membres": "Membres",
  "/transactions": "Comptabilité",
  "/evenements": "Événements",
  "/inventaire": "Inventaire",
  "/logs": "Journaux d'activité",
};

export default function Layout() {
  const location = useLocation();
  const title = titles[location.pathname] || "NJC Grigny";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f3efe0",
      }}
    >
      <Sidebar />
      <div
        style={{
          marginLeft: "256px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Header title={title} />
        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
