import { Bell, Search } from "lucide-react";

function Navbar() {
  return (
    <header className="fixed left-64 right-0 top-0 z-10 h-16 border-b border-slate-700 bg-slate-900 px-6 text-white">
      <div className="flex h-full items-center justify-between">

        {/* Search */}
        <div className="flex items-center gap-3">
          <Search size={20} className="text-slate-400" />

          <input
            type="text"
            placeholder="Search..."
            className="w-64 bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6">

          <button className="relative">
            <Bell size={21} />

            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div>
            <p className="text-sm font-medium">Deepak</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>

        </div>
      </div>
    </header>
  );
}

export default Navbar;