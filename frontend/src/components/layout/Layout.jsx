import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <Sidebar />

      <div className="ml-64">

        <Navbar />

        <main className="min-h-screen pt-16 p-6">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default Layout;