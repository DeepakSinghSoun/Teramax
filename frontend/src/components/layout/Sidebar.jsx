import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldAlert,
  Network,
  Terminal,
  FileText,
  User,
  Settings,
  LogOut,
} from "lucide-react";

function Sidebar() {
  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Alerts", path: "/alerts", icon: ShieldAlert },
    { name: "Network", path: "/network", icon: Network },
    { name: "Commands", path: "/commands", icon: Terminal },
    { name: "Reports", path: "/reports", icon: FileText },
    { name: "Profile", path: "/profile", icon: User },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white">
      
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-700 px-6">
        <h1 className="text-2xl font-bold">Teramax</h1>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Logout */}
        <button className="mt-8 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-800">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;