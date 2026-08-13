import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
} from "lucide-react";

const alerts = [
  {
    id: 1,
    type: "Brute Force Attack",
    source: "192.168.1.23",
    target: "192.168.1.10",
    risk: "Critical",
    status: "Active",
    time: "2 min ago",
    description: "Multiple failed login attempts detected.",
  },
  {
    id: 2,
    type: "Port Scan",
    source: "192.168.1.15",
    target: "192.168.1.20",
    risk: "High",
    status: "Active",
    time: "8 min ago",
    description: "Multiple ports scanned from a single source.",
  },
  {
    id: 3,
    type: "DoS Attack",
    source: "192.168.1.45",
    target: "192.168.1.5",
    risk: "High",
    status: "Investigating",
    time: "15 min ago",
    description: "Abnormal traffic volume detected.",
  },
  {
    id: 4,
    type: "Suspicious Command",
    source: "192.168.1.10",
    target: "Server",
    risk: "Medium",
    status: "Resolved",
    time: "22 min ago",
    description: "Potentially dangerous command detected.",
  },
  {
    id: 5,
    type: "Network Anomaly",
    source: "192.168.1.30",
    target: "Network",
    risk: "Low",
    status: "Resolved",
    time: "35 min ago",
    description: "Unusual network behavior detected.",
  },
];

function getRiskStyle(risk) {
  switch (risk) {
    case "Critical":
      return "bg-red-500/10 text-red-400 border-red-500/20";

    case "High":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";

    case "Medium":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

    default:
      return "bg-green-500/10 text-green-400 border-green-500/20";
  }
}

function getStatusStyle(status) {
  switch (status) {
    case "Active":
      return "bg-red-500/10 text-red-400";

    case "Investigating":
      return "bg-yellow-500/10 text-yellow-400";

    default:
      return "bg-green-500/10 text-green-400";
  }
}

function Alerts() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Security Alerts
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Monitor and investigate detected security threats.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-red-400" size={22} />

            <div>
              <p className="text-sm text-slate-400">
                Critical
              </p>

              <p className="text-2xl font-bold text-white">
                01
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-400" size={22} />

            <div>
              <p className="text-sm text-slate-400">
                High Risk
              </p>

              <p className="text-2xl font-bold text-white">
                02
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-400" size={22} />

            <div>
              <p className="text-sm text-slate-400">
                Medium Risk
              </p>

              <p className="text-2xl font-bold text-white">
                01
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-green-400" size={22} />

            <div>
              <p className="text-sm text-slate-400">
                Resolved
              </p>

              <p className="text-2xl font-bold text-white">
                02
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* Search */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 lg:w-96">

            <Search
              size={18}
              className="text-slate-500"
            />

            <input
              type="text"
              placeholder="Search alerts..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            />

          </div>

          {/* Filters */}
          <div className="flex gap-3">

            <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800">
              <Filter size={16} />
              Risk
            </button>

            <button className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800">
              Status
            </button>

          </div>

        </div>

      </div>

      {/* Alerts Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="border-b border-slate-800 bg-slate-950">

              <tr className="text-xs uppercase text-slate-500">

                <th className="px-6 py-4">
                  Threat
                </th>

                <th className="px-6 py-4">
                  Source
                </th>

                <th className="px-6 py-4">
                  Target
                </th>

                <th className="px-6 py-4">
                  Risk
                </th>

                <th className="px-6 py-4">
                  Status
                </th>

                <th className="px-6 py-4">
                  Time
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-800">

              {alerts.map((alert) => (

                <tr
                  key={alert.id}
                  className="transition hover:bg-slate-800/40"
                >

                  {/* Threat */}
                  <td className="px-6 py-5">

                    <div>
                      <p className="font-medium text-white">
                        {alert.type}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {alert.description}
                      </p>
                    </div>

                  </td>

                  {/* Source */}
                  <td className="px-6 py-5 font-mono text-sm text-slate-300">
                    {alert.source}
                  </td>

                  {/* Target */}
                  <td className="px-6 py-5 font-mono text-sm text-slate-300">
                    {alert.target}
                  </td>

                  {/* Risk */}
                  <td className="px-6 py-5">

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getRiskStyle(
                        alert.risk
                      )}`}
                    >
                      {alert.risk}
                    </span>

                  </td>

                  {/* Status */}
                  <td className="px-6 py-5">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                        alert.status
                      )}`}
                    >
                      {alert.status}
                    </span>

                  </td>

                  {/* Time */}
                  <td className="px-6 py-5 text-sm text-slate-500">
                    {alert.time}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Alerts;